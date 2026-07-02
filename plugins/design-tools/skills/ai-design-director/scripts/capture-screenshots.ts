#!/usr/bin/env -S npx tsx
/**
 * capture-screenshots.ts — 목업 스크린샷 캡처 (AI Design Director)
 *
 * BUILD CONTRACT §14 / §3(audit/screenshots, before/after).
 * 실행 중인 목업 URL 을 받아 뷰포트별(desktop/tablet/mobile)로 스크린샷을 저장한다.
 * /design-prototype 산출 검수, /design-audit 의 before/after 캡처에 쓰인다.
 *
 * 전제: Playwright. 미설치 시 *환상 실행* 하지 않고, 설치 안내 후 graceful exit(코드 2).
 * (CONTRACT §12 주: 환상 API/실행 결과를 지어내지 말 것.)
 *
 * 부가 점검(옵션):
 *   --check-console   콘솔 오류(console.error / pageerror)를 수집해 1건이라도 있으면 exit 1
 *   --check-overflow  가로 스크롤(문서 너비 > 뷰포트 너비) 발생 시 exit 1
 *
 * 사용법:
 *   npx tsx scripts/capture-screenshots.ts --url <URL> --out <디렉토리>
 *     [--routes /a,/b,/c] [--viewports desktop,tablet,mobile] [--full-page]
 *     [--label <접두어>] [--check-console] [--check-overflow] [--timeout <ms>] [--quiet]
 *
 *   --url            캡처할 실행 중 URL (필수). --routes 와 함께면 base origin 으로 결합.
 *                    예: http://localhost:5173
 *   --out            저장 디렉토리 (필수). 예: design/audit/screenshots
 *   --routes         쉼표 구분 경로 목록 (선택). --url 을 base 로 각 경로를 결합해
 *                    경로 × 뷰포트마다 캡처한다. 파일명은 {routeLabel}-{viewport}.png.
 *                    routeLabel = 경로 sanitize ("/customers/1/edit"→"customers-1-edit", "/"→"home").
 *                    미지정 시 --url 단일 캡처(하위호환). --label 과 함께면 "{label}-{routeLabel}-{viewport}".
 *   --viewports      쉼표 구분 뷰포트 목록 (기본: desktop,tablet,mobile)
 *   --full-page      전체 페이지 캡처(기본은 뷰포트 캡처)
 *   --label          파일명 접두어 (예: customer-list → customer-list-desktop.png)
 *   --check-console  콘솔 오류 점검
 *   --check-overflow 가로 스크롤 점검
 *   --timeout        페이지 로드 타임아웃 ms (기본 15000)
 *   --quiet          로그 최소화
 *   --help           도움말
 *
 * 종료코드: 0=성공, 1=점검 실패(콘솔오류/가로스크롤) 또는 캡처 오류, 2=Playwright 미설치(설치 안내).
 * 의존성: playwright(선택, 동적 import). 미설치 시 graceful 안내.
 */

import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// --------------------------------------------------------------------------
// 뷰포트 사전 (TOKENS breakpoint 와 정합: mobile<640, tablet 640-1024, desktop>1024)
// --------------------------------------------------------------------------
const VIEWPORTS: Record<string, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

// --------------------------------------------------------------------------
// 인자
// --------------------------------------------------------------------------
interface Args {
  url: string;
  out: string;
  routes: string[];
  viewports: string[];
  fullPage: boolean;
  label: string;
  checkConsole: boolean;
  checkOverflow: boolean;
  timeout: number;
  quiet: boolean;
  help: boolean;
}
function parseArgs(argv: string[]): Args {
  const a: Args = {
    url: '',
    out: '',
    routes: [],
    viewports: ['desktop', 'tablet', 'mobile'],
    fullPage: false,
    label: '',
    checkConsole: false,
    checkOverflow: false,
    timeout: 15000,
    quiet: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--help' || t === '-h') a.help = true;
    else if (t === '--full-page') a.fullPage = true;
    else if (t === '--check-console') a.checkConsole = true;
    else if (t === '--check-overflow') a.checkOverflow = true;
    else if (t === '--quiet') a.quiet = true;
    else if (t === '--url') a.url = argv[++i] ?? '';
    else if (t === '--out') a.out = argv[++i] ?? '';
    else if (t === '--label') a.label = argv[++i] ?? '';
    else if (t === '--timeout') a.timeout = Number(argv[++i] ?? a.timeout) || a.timeout;
    else if (t === '--routes') a.routes = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (t === '--viewports') a.viewports = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  }
  return a;
}

// --------------------------------------------------------------------------
// 경로 → 파일명 라벨 sanitize
//   "/customers/1/edit" → "customers-1-edit", "/" → "home", "" → "home"
//   쿼리스트링·해시 제거, 영숫자 외 문자는 하이픈으로, 중복/양끝 하이픈 정리.
// --------------------------------------------------------------------------
function routeLabel(route: string): string {
  const path = route.split(/[?#]/)[0];
  const slug = path
    .replace(/[^a-zA-Z0-9]+/g, '-') // 영숫자 외 → 하이픈
    .replace(/^-+|-+$/g, '')        // 양끝 하이픈 제거
    .toLowerCase();
  return slug || 'home';
}

// --------------------------------------------------------------------------
// base URL + route 결합 (URL 클래스로 안전 결합 — 슬래시 중복/누락 방지)
// --------------------------------------------------------------------------
function joinUrl(base: string, route: string): string {
  try {
    return new URL(route, base).toString();
  } catch {
    // base 가 절대 URL 이 아니거나 결합 실패 — 단순 결합 fallback
    return base.replace(/\/+$/, '') + '/' + route.replace(/^\/+/, '');
  }
}

const HELP = `capture-screenshots.ts — 목업 스크린샷 캡처(뷰포트별)

사용법:
  npx tsx scripts/capture-screenshots.ts --url <URL> --out <디렉토리> [옵션]

필수:
  --url <URL>        실행 중 URL (예: http://localhost:5173). --routes 와 함께면 base origin.
  --out <디렉토리>   저장 디렉토리 (예: design/audit/screenshots)

옵션:
  --routes /a,/b,/c  쉼표 구분 경로 목록. --url 을 base 로 결합해 경로×뷰포트마다 캡처.
                     파일명: {routeLabel}-{viewport}.png (예: /customers/1/edit → customers-1-edit-desktop.png, / → home-desktop.png).
                     미지정 시 단일 --url 캡처(하위호환).
  --viewports a,b,c  뷰포트 목록 (기본: desktop,tablet,mobile)
                     desktop=1440x900, tablet=834x1112, mobile=390x844
  --full-page        전체 페이지 캡처
  --label <접두어>   파일명 접두어 (예: customer-list → customer-list-desktop.png; --routes 와 함께면 label-routeLabel-viewport)
  --check-console    콘솔 오류 점검(있으면 exit 1)
  --check-overflow   가로 스크롤 점검(있으면 exit 1)
  --timeout <ms>     로드 타임아웃 (기본 15000)
  --quiet            로그 최소화
  --help, -h         이 도움말

종료코드: 0=성공, 1=점검 실패/캡처 오류, 2=Playwright 미설치(설치 안내)

Playwright 설치(미설치 시):
  npm i -D playwright && npx playwright install chromium`;

// --------------------------------------------------------------------------
// Playwright 동적 로드 — 미설치 시 graceful
// --------------------------------------------------------------------------
async function loadPlaywright(): Promise<any | null> {
  try {
    // @ts-ignore — 선택 의존성
    const pw = await import('playwright');
    return pw.chromium ?? (pw.default && pw.default.chromium) ?? null;
  } catch {
    return null;
  }
}

function installGuide(): void {
  console.error('[안내] Playwright 가 설치되어 있지 않습니다. 스크린샷 캡처는 Playwright 를 필요로 합니다.');
  console.error('  설치:');
  console.error('    npm i -D playwright');
  console.error('    npx playwright install chromium');
  console.error('  설치 후 다시 실행하세요. (환상 실행 결과를 만들지 않기 위해 여기서 중단합니다.)');
}

// --------------------------------------------------------------------------
// 메인
// --------------------------------------------------------------------------
async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return 0; }

  if (!args.url || !args.out) {
    console.error('[오류] --url 과 --out 은 필수입니다.');
    console.error('  예: npx tsx scripts/capture-screenshots.ts --url http://localhost:5173 --out design/audit/screenshots');
    console.error('  도움말: --help');
    return 1;
  }

  // 뷰포트 검증
  const unknown = args.viewports.filter((v) => !(v in VIEWPORTS));
  if (unknown.length) {
    console.error(`[오류] 알 수 없는 뷰포트: ${unknown.join(', ')}. 사용 가능: ${Object.keys(VIEWPORTS).join(', ')}.`);
    return 1;
  }

  const chromium = await loadPlaywright();
  if (!chromium) {
    installGuide();
    return 2; // 미설치 — 점검 실패(1)와 구분
  }

  const outDir = resolve(process.cwd(), args.out);
  await mkdir(outDir, { recursive: true });
  const prefix = args.label ? `${args.label}-` : '';

  // 캡처 대상(target) 목록 구성:
  //   --routes 있으면 경로마다 { url: base+route, slug: routeLabel } 하나씩.
  //   --routes 없으면 단일 { url, slug: '' } — 기존 단일 캡처 동작 보존(하위호환).
  interface Target { url: string; slug: string; }
  const targets: Target[] = args.routes.length
    ? args.routes.map((r) => ({ url: joinUrl(args.url, r), slug: routeLabel(r) }))
    : [{ url: args.url, slug: '' }];

  if (!args.quiet) {
    console.log(`[캡처] base URL: ${args.url}`);
    console.log(`[캡처] 저장: ${args.out}`);
    if (args.routes.length) console.log(`[캡처] 경로(${targets.length}): ${args.routes.join(', ')}`);
    console.log(`[캡처] 뷰포트: ${args.viewports.join(', ')}${args.fullPage ? ' (full-page)' : ''}`);
  }

  let browser: any;
  let hadConsoleError = false;
  let hadOverflow = false;
  const saved: string[] = [];

  try {
    browser = await chromium.launch();
    for (const target of targets) {
      for (const vp of args.viewports) {
        const { width, height } = VIEWPORTS[vp];
        const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
        const page = await context.newPage();

        const consoleErrors: string[] = [];
        if (args.checkConsole) {
          page.on('console', (msg: any) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
          page.on('pageerror', (err: Error) => consoleErrors.push(`pageerror: ${err.message}`));
        }

        try {
          await page.goto(target.url, { waitUntil: 'networkidle', timeout: args.timeout });
        } catch (e) {
          console.error(`[오류] ${vp}: 페이지 로드 실패 (${target.url}) — ${(e as Error).message}`);
          console.error('  URL 이 실제로 실행 중인지(예: npm run dev) 확인하세요.');
          await context.close();
          await browser.close();
          return 1;
        }

        // 가로 스크롤(overflow) 점검 — 문서 스크롤 너비가 뷰포트보다 넓은가
        if (args.checkOverflow) {
          const overflow = await page.evaluate(() => {
            const de = document.documentElement;
            return { scrollW: de.scrollWidth, clientW: de.clientWidth };
          });
          if (overflow.scrollW > overflow.clientW + 1) {
            hadOverflow = true;
            console.warn(`[가로스크롤] ${target.slug || target.url} ${vp}: 문서 너비 ${overflow.scrollW}px > 뷰포트 ${overflow.clientW}px. 반응형 재배치 필요(축소 금지).`);
          }
        }

        // 파일명: {label-}{routeLabel-}{viewport}.png
        //   --routes 시: {routeLabel}-{viewport}.png (label 있으면 앞에 접두)
        //   --routes 없을 시: {label-}{viewport}.png (기존 동작 보존)
        const slugPart = target.slug ? `${target.slug}-` : '';
        const file = `${prefix}${slugPart}${vp}.png`;
        const filePath = resolve(outDir, file);
        await page.screenshot({ path: filePath, fullPage: args.fullPage });
        saved.push(file);
        if (!args.quiet) console.log(`  ✓ ${file} (${width}x${height})`);

        if (args.checkConsole && consoleErrors.length) {
          hadConsoleError = true;
          console.warn(`[콘솔오류] ${target.slug || target.url} ${vp}: ${consoleErrors.length}건`);
          consoleErrors.slice(0, 10).forEach((m) => console.warn(`    - ${m}`));
        }

        await context.close();
      }
    }
  } catch (e) {
    console.error('[오류] 캡처 중 예외:', (e as Error).message);
    if (browser) await browser.close().catch(() => {});
    return 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  if (!args.quiet) console.log(`\n[완료] ${saved.length}개 스크린샷 저장: ${args.out}`);

  // 점검 실패 처리
  const failed: string[] = [];
  if (args.checkConsole && hadConsoleError) failed.push('콘솔 오류');
  if (args.checkOverflow && hadOverflow) failed.push('가로 스크롤');
  if (failed.length) {
    console.error(`\n[실패] 점검 항목 위반: ${failed.join(', ')}. (스크린샷은 저장됨 — 검수에 활용)`);
    return 1;
  }
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error('[치명] 예기치 못한 오류:', e);
    process.exit(1);
  });
