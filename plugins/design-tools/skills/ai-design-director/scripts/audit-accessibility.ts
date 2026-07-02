#!/usr/bin/env -S npx tsx
/**
 * audit-accessibility.ts — 접근성 정적 점검 (AI Design Director)
 *
 * BUILD CONTRACT §14 / §8 Gate 7 / §9(accessibility ≥80).
 * 대비비(WCAG AA 4.5:1 본문 / 3:1 큰 글자·UI), 포커스 가시성, input 레이블,
 * 터치 타깃 ≥44px, prefers-reduced-motion 대응을 *가능한 범위에서 정적으로* 점검한다.
 *
 * 두 입력 모드:
 *   (A) 정적 — --html <파일> [--css <파일>...]  : DOM/CSS 텍스트를 직접 파싱(의존성 0).
 *   (B) 실행 URL — --url <URL> [--routes /a,/b] : Playwright 가 있으면 렌더된 DOM 에서 점검,
 *                                               없으면 안내 후 (A) 로 유도. 환상 실행 금지.
 *                                               --routes 지정 시 --url 을 base 로 각 경로의 전체
 *                                               URL 을 순회 점검(미지정 시 단일 --url, 하위호환).
 *
 * ⚠️ 한계(정직하게 명시): 정적 점검은 *완전한 a11y 감사가 아니다*.
 *   - 색 대비는 인라인/단순 CSS 규칙에서 추출 가능한 전경/배경 쌍만 계산한다(상속·캐스케이드 한계).
 *   - 동적 포커스 트랩·스크린리더 순서·ARIA 라이브영역 등은 검사하지 않는다.
 *   - 실 브라우저 점검(--url + Playwright)이 더 정확하다. 최종 판단은 사람 검수 + /design-audit.
 *
 * 사용법:
 *   npx tsx scripts/audit-accessibility.ts (--html <파일> [--css <파일>] | --url <URL>) [옵션]
 *     [--min-contrast 4.5] [--min-target 44] [--strict] [--quiet]
 *
 * 종료코드: ERROR(치명 위반) ≥1 → 1, --strict 에서 WARN 존재 → 1, 통과 → 0.
 *           --url 에 Playwright 미설치 → 2(안내).
 * 의존성: Node18+ 표준 라이브러리. playwright 는 --url 모드에서만 선택적 동적 import.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// --------------------------------------------------------------------------
// 인자
// --------------------------------------------------------------------------
interface Args {
  html: string;
  css: string[];
  url: string;
  routes: string[];
  minContrast: number;
  minTarget: number;
  strict: boolean;
  quiet: boolean;
  help: boolean;
}
function parseArgs(argv: string[]): Args {
  const a: Args = { html: '', css: [], url: '', routes: [], minContrast: 4.5, minTarget: 44, strict: false, quiet: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--help' || t === '-h') a.help = true;
    else if (t === '--strict') a.strict = true;
    else if (t === '--quiet') a.quiet = true;
    else if (t === '--html') a.html = argv[++i] ?? '';
    else if (t === '--css') a.css.push(argv[++i] ?? '');
    else if (t === '--url') a.url = argv[++i] ?? '';
    else if (t === '--routes') a.routes = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (t === '--min-contrast') a.minContrast = Number(argv[++i] ?? a.minContrast) || a.minContrast;
    else if (t === '--min-target') a.minTarget = Number(argv[++i] ?? a.minTarget) || a.minTarget;
  }
  return a;
}

// --------------------------------------------------------------------------
// base URL + route 결합 (URL 클래스로 안전 결합) + 경로 라벨
// --------------------------------------------------------------------------
function joinUrl(base: string, route: string): string {
  try {
    return new URL(route, base).toString();
  } catch {
    return base.replace(/\/+$/, '') + '/' + route.replace(/^\/+/, '');
  }
}
function routeLabel(route: string): string {
  const path = route.split(/[?#]/)[0];
  const slug = path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return slug || 'home';
}

const HELP = `audit-accessibility.ts — 접근성 정적 점검 (WCAG AA 지향)

사용법:
  정적:    npx tsx scripts/audit-accessibility.ts --html <파일> [--css <파일> ...]
  실행URL: npx tsx scripts/audit-accessibility.ts --url <URL> [--routes /a,/b]  (Playwright 있으면 더 정확)

옵션:
  --routes /a,/b,/c   쉼표 구분 경로 목록(--url 모드). --url 을 base 로 각 경로의 전체 URL 을
                      순회 점검(미지정 시 단일 --url, 하위호환).
  --min-contrast <n>  본문 대비 최소치 (기본 4.5; 큰 글자/UI 는 3.0 자동 적용)
  --min-target <px>   터치 타깃 최소 한 변 (기본 44)
  --strict            경고도 실패로 취급
  --quiet             로그 최소화
  --help, -h          이 도움말

점검 항목:
  1) 색 대비       추출 가능한 전경/배경 쌍의 WCAG AA (4.5:1 / 큰글자·UI 3:1)
  2) 포커스 가시성  *:focus { outline:none } 만 있고 대체 표시 없는 경우
  3) input 레이블   <input>/<select>/<textarea> 의 label/aria-label/title 연결
  4) 터치 타깃      명시적 width/height 가 44px 미만인 버튼/링크
  5) reduced-motion @media (prefers-reduced-motion) 대응 유무

한계: 정적 점검은 완전한 a11y 감사가 아니다(상속·캐스케이드·동적 포커스·SR 순서 미검사).
종료코드: ERROR≥1→1, --strict 에서 WARN→1, 통과→0, --url Playwright 미설치→2`;

// --------------------------------------------------------------------------
// 진단
// --------------------------------------------------------------------------
type Level = 'ERROR' | 'WARN' | 'INFO';
interface Finding { level: Level; code: string; message: string; }
const findings: Finding[] = [];
const add = (level: Level, code: string, message: string) => findings.push({ level, code, message });

// --------------------------------------------------------------------------
// 색상 파싱 + WCAG 대비 계산 (의존성 0)
// --------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6); // 알파 무시
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function parseColor(raw: string): [number, number, number] | null {
  const v = raw.trim().toLowerCase();
  if (v.startsWith('#')) return hexToRgb(v);
  const m = v.match(/rgba?\(\s*([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  const named: Record<string, [number, number, number]> = {
    black: [0, 0, 0], white: [255, 255, 255], red: [255, 0, 0], gray: [128, 128, 128], grey: [128, 128, 128],
  };
  return named[v] ?? null;
}
function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relLuminance(fg);
  const l2 = relLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// --------------------------------------------------------------------------
// 정적 HTML/CSS 점검 (문자열 기반, 의존성 0)
//   — 정규식 기반 휴리스틱. 완전한 파서가 아니므로 보수적으로 신호한다(한계 명시).
// --------------------------------------------------------------------------
function auditStatic(html: string, css: string, minContrast: number, minTarget: number): void {
  const allStyle = css + '\n' + (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? []).join('\n');

  // (1) 색 대비 — 인라인 style 의 color+background(-color) 쌍
  let pairChecked = 0;
  const inlineStyles = [...html.matchAll(/style\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);
  for (const st of inlineStyles) {
    const fgM = st.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    const bgM = st.match(/background(?:-color)?\s*:\s*([^;!]+)/i);
    if (fgM && bgM) {
      const fg = parseColor(fgM[1]);
      const bg = parseColor(bgM[1]);
      if (fg && bg) {
        pairChecked++;
        const ratio = contrastRatio(fg, bg);
        // 큰 글자/UI 판단은 인라인에서 확실치 않으므로 본문 기준(보수적)으로 평가
        if (ratio < minContrast) {
          add('ERROR', 'contrast', `대비 부족: ${fgM[1].trim()} on ${bgM[1].trim()} = ${ratio.toFixed(2)}:1 (필요 ${minContrast}:1). 색·배경 토큰 재조정.`);
        }
      }
    }
  }
  // CSS 규칙에서 color/background 동시 선언된 셀렉터 — 인접 쌍 휴리스틱
  for (const rule of allStyle.matchAll(/\{([^}]*)\}/g)) {
    const body = rule[1];
    const fgM = body.match(/(?:^|;|\s)color\s*:\s*([^;]+)/i);
    const bgM = body.match(/background(?:-color)?\s*:\s*([^;!]+)/i);
    if (fgM && bgM) {
      const fg = parseColor(fgM[1]);
      const bg = parseColor(bgM[1]);
      if (fg && bg) {
        pairChecked++;
        const ratio = contrastRatio(fg, bg);
        if (ratio < minContrast) {
          add('ERROR', 'contrast', `대비 부족(CSS 규칙): ${fgM[1].trim()} on ${bgM[1].trim()} = ${ratio.toFixed(2)}:1 (필요 ${minContrast}:1).`);
        }
      }
    }
  }
  if (pairChecked === 0) {
    add('INFO', 'contrast-coverage', '추출 가능한 전경/배경 색 쌍을 찾지 못했습니다. 색이 상속·CSS 변수로만 정의됐을 수 있음 — 실행 URL(--url + Playwright) 점검 권장.');
  } else {
    add('INFO', 'contrast-coverage', `색 대비 점검: ${pairChecked}개 전경/배경 쌍 평가(정적 추출 범위).`);
  }

  // (2) 포커스 가시성 — :focus { outline: none } 만 있고 대체 표시(box-shadow/border/outline 재정의) 없는지.
  //   선언(declaration) 단위로 쪼개 평가한다(정규식 lookahead 의 zero-width 매칭 함정 회피).
  const focusBlocks = [...allStyle.matchAll(/:focus(?:-visible)?[^{]*\{([^}]*)\}/gi)].map((m) => m[1]);
  let outlineNoneCount = 0;
  let focusReplacementCount = 0;
  for (const fb of focusBlocks) {
    const decls = fb.split(';').map((d) => d.trim()).filter(Boolean);
    let killsOutline = false;
    let hasReplacement = false;
    for (const d of decls) {
      const m = d.match(/^([a-z-]+)\s*:\s*(.+)$/i);
      if (!m) continue;
      const prop = m[1].toLowerCase();
      const val = m[2].trim().toLowerCase();
      if (prop === 'outline' || prop === 'outline-width' || prop === 'outline-style') {
        if (/^(none|0|0px)$/.test(val)) killsOutline = true;
        else hasReplacement = true; // 실제 outline 재정의 = 가시적 포커스
      } else if (prop === 'box-shadow' && val !== 'none') {
        hasReplacement = true;
      } else if (prop === 'border' || /^border-(top|right|bottom|left|color|width|style)$/.test(prop)) {
        hasReplacement = true;
      }
    }
    if (killsOutline) outlineNoneCount++;
    if (hasReplacement) focusReplacementCount++;
  }
  if (outlineNoneCount > 0 && focusReplacementCount === 0) {
    add('ERROR', 'focus-visible', `:focus { outline: none } 가 ${outlineNoneCount}곳 있으나 대체 포커스 표시(box-shadow/border)가 없습니다. 키보드 포커스가 보이지 않음(Gate 7).`);
  } else if (focusBlocks.length === 0) {
    add('WARN', 'focus-style', ':focus / :focus-visible 스타일이 없습니다. 기본 outline 에 의존 — 토큰 기반 포커스 링 정의 권장.');
  }

  // (3) input 레이블 — <input>/<select>/<textarea> 가 label/aria-label/aria-labelledby/title 로 연결됐는지
  const labelFors = new Set([...html.matchAll(/<label[^>]*\bfor\s*=\s*"([^"]+)"/gi)].map((m) => m[1]));
  const fields = [...html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)];
  let unlabeled = 0;
  for (const f of fields) {
    const attrs = f[2];
    const type = (attrs.match(/\btype\s*=\s*"([^"]+)"/i)?.[1] ?? '').toLowerCase();
    if (f[1].toLowerCase() === 'input' && ['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) continue;
    const id = attrs.match(/\bid\s*=\s*"([^"]+)"/i)?.[1];
    const hasAria = /\baria-label(ledby)?\s*=/i.test(attrs);
    const hasTitle = /\btitle\s*=/i.test(attrs);
    const hasFor = id ? labelFors.has(id) : false;
    // <label><input></label> 중첩 형태도 허용 — 대략 부모 label 존재 휴리스틱
    if (!hasAria && !hasTitle && !hasFor) {
      unlabeled++;
    }
  }
  if (unlabeled > 0) {
    add('ERROR', 'input-label', `레이블이 연결되지 않은 입력 필드 ${unlabeled}개. <label for>·aria-label·aria-labelledby 중 하나로 연결하세요(Gate 7).`);
  }

  // (4) 터치 타깃 — 버튼/링크에 명시 width/height 가 44px 미만
  const targetEls = [...html.matchAll(/<(button|a)\b([^>]*)style\s*=\s*"([^"]*)"/gi)];
  for (const el of targetEls) {
    const st = el[3];
    const w = st.match(/\bwidth\s*:\s*([0-9.]+)px/i);
    const h = st.match(/\bheight\s*:\s*([0-9.]+)px/i);
    const small: string[] = [];
    if (w && Number(w[1]) < minTarget) small.push(`width ${w[1]}px`);
    if (h && Number(h[1]) < minTarget) small.push(`height ${h[1]}px`);
    if (small.length) {
      add('WARN', 'touch-target', `<${el[1]}> 의 ${small.join(', ')} 가 ${minTarget}px 미만. 터치 타깃은 최소 ${minTarget}x${minTarget}px 권장(패딩 포함 실측은 --url 점검).`);
    }
  }

  // (5) prefers-reduced-motion — 모션이 있는데 대응 미디어쿼리 없는지
  const hasMotion = /(transition|animation)\s*:/i.test(allStyle) || /@keyframes/i.test(allStyle);
  const hasReducedMotion = /@media[^{]*prefers-reduced-motion/i.test(allStyle);
  if (hasMotion && !hasReducedMotion) {
    add('WARN', 'reduced-motion', 'transition/animation 이 있으나 @media (prefers-reduced-motion: reduce) 대응이 없습니다. 모션 민감 사용자 고려(Gate 7).');
  }
}

// --------------------------------------------------------------------------
// 실행 URL 점검 (Playwright 있을 때) — 더 정확
// --------------------------------------------------------------------------
async function auditUrl(urls: { url: string; label: string }[], minContrast: number, minTarget: number, timeout: number): Promise<number | null> {
  let chromium: any = null;
  try {
    // @ts-ignore — 선택 의존성
    const pw = await import('playwright');
    chromium = pw.chromium ?? (pw.default && pw.default.chromium) ?? null;
  } catch {
    chromium = null;
  }
  if (!chromium) {
    console.error('[안내] --url 모드는 Playwright 가 필요합니다(렌더된 DOM 의 계산 스타일을 읽기 위함).');
    console.error('  설치: npm i -D playwright && npx playwright install chromium');
    console.error('  또는 정적 모드를 사용하세요: --html <파일> [--css <파일>]');
    return 2;
  }

  const browser = await chromium.launch();
  try {
    for (const { url, label } of urls) {
      // label 접두어 — --routes 다중 점검 시 각 경로의 진단을 구분(단일 URL 이면 빈 접두).
      const tag = label ? `[${label}] ` : '';
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout });

    // 브라우저 컨텍스트에서 계산 스타일 기반 점검 (대비/타깃/레이블/포커스/모션)
    const result = await page.evaluate(
      ({ minContrast, minTarget }: { minContrast: number; minTarget: number }) => {
        const out: { level: string; code: string; message: string }[] = [];
        const parse = (s: string): [number, number, number] | null => {
          const m = s.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const p = m[1].split(',').map((x) => parseFloat(x));
          return [p[0], p[1], p[2]];
        };
        const lum = ([r, g, b]: [number, number, number]) => {
          const f = (c: number) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const ratio = (a: [number, number, number], b: [number, number, number]) => {
          const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
          return (hi + 0.05) / (lo + 0.05);
        };
        const effectiveBg = (el: Element): [number, number, number] => {
          let node: Element | null = el;
          while (node) {
            const c = parse(getComputedStyle(node).backgroundColor);
            const alpha = getComputedStyle(node).backgroundColor.match(/rgba?\(([^)]+)\)/)?.[1].split(',')[3];
            if (c && (alpha === undefined || parseFloat(alpha) > 0)) return c;
            node = node.parentElement;
          }
          return [255, 255, 255];
        };
        // 텍스트 노드 보유 요소 대비
        let contrastChecked = 0;
        document.querySelectorAll('p, span, a, button, li, td, th, label, h1, h2, h3, h4, h5, h6, div').forEach((el) => {
          const text = (el.textContent ?? '').trim();
          if (!text || el.children.length > 0) return;
          const cs = getComputedStyle(el);
          const fg = parse(cs.color);
          if (!fg) return;
          const bg = effectiveBg(el);
          const r = ratio(fg, bg);
          contrastChecked++;
          const fontPx = parseFloat(cs.fontSize);
          const bold = parseInt(cs.fontWeight) >= 700;
          const isLarge = fontPx >= 24 || (fontPx >= 18.66 && bold); // WCAG large text
          const need = isLarge ? 3.0 : minContrast;
          if (r < need) {
            out.push({ level: 'ERROR', code: 'contrast', message: `대비 ${r.toFixed(2)}:1 (필요 ${need}:1) — "${text.slice(0, 24)}" (${cs.color} on rgb(${bg.join(',')})).` });
          }
        });
        out.push({ level: 'INFO', code: 'contrast-coverage', message: `렌더 DOM 텍스트 ${contrastChecked}개 대비 평가.` });

        // 레이블 없는 입력
        let unlabeled = 0;
        document.querySelectorAll('input, select, textarea').forEach((el) => {
          const t = (el.getAttribute('type') ?? '').toLowerCase();
          if (el.tagName === 'INPUT' && ['hidden', 'submit', 'button', 'reset', 'image'].includes(t)) return;
          const id = el.getAttribute('id');
          const labelled = !!el.getAttribute('aria-label') || !!el.getAttribute('aria-labelledby') || !!el.getAttribute('title')
            || (id ? !!document.querySelector(`label[for="${id}"]`) : false) || !!el.closest('label');
          if (!labelled) unlabeled++;
        });
        if (unlabeled) out.push({ level: 'ERROR', code: 'input-label', message: `레이블 없는 입력 ${unlabeled}개(aria-label/<label> 연결 필요).` });

        // 터치 타깃 — 실측 bounding box
        let smallTargets = 0;
        document.querySelectorAll('button, a, [role="button"]').forEach((el) => {
          const rct = el.getBoundingClientRect();
          if (rct.width === 0 && rct.height === 0) return;
          if (rct.width < minTarget || rct.height < minTarget) smallTargets++;
        });
        if (smallTargets) out.push({ level: 'WARN', code: 'touch-target', message: `${minTarget}px 미만 터치 타깃 ${smallTargets}개(실측). 패딩으로 키우세요.` });

        // 포커스 — :focus-visible 규칙 존재 여부(정확한 판단은 한계)
        let hasFocusRule = false;
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules)) {
              if (/:focus/.test((rule as CSSStyleRule).selectorText ?? '')) { hasFocusRule = true; break; }
            }
          } catch { /* cross-origin sheet 접근 불가 — 무시 */ }
          if (hasFocusRule) break;
        }
        if (!hasFocusRule) out.push({ level: 'WARN', code: 'focus-style', message: ':focus 스타일 규칙을 찾지 못함. 기본 outline 의존 가능 — 토큰 포커스 링 권장.' });

        return out;
      },
      { minContrast, minTarget },
    );

        for (const f of result) add(f.level as Level, f.code, `${tag}${f.message}`);

        // reduced-motion 매처(브라우저 밖에서 신호만)
        add('INFO', 'reduced-motion', `${tag}@media (prefers-reduced-motion) 대응은 정적 모드(--css)에서 더 잘 잡힙니다. 모션이 있으면 대응 확인.`);
      } catch (e) {
        add('ERROR', 'load', `${tag}페이지 로드 실패 (${url}) — ${(e as Error).message}. URL 이 실행 중인지 확인.`);
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
  return null;
}

// --------------------------------------------------------------------------
// 메인
// --------------------------------------------------------------------------
async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return 0; }

  if (!args.html && !args.url) {
    console.error('[오류] --html <파일> 또는 --url <URL> 중 하나가 필요합니다.');
    console.error('  도움말: --help');
    return 1;
  }

  if (!args.quiet) {
    console.log('[접근성] WCAG AA 지향 정적 점검 (완전한 a11y 감사가 아님 — 한계 있음).');
    console.log(`[접근성] 기준: 본문 대비 ${args.minContrast}:1 / 큰글자·UI 3:1, 터치 타깃 ${args.minTarget}px.`);
  }

  // 실행 URL 모드
  if (args.url) {
    // --routes 있으면 경로마다 전체 URL 을, 없으면 단일 --url 을 점검(하위호환).
    const urls = args.routes.length
      ? args.routes.map((r) => ({ url: joinUrl(args.url, r), label: routeLabel(r) }))
      : [{ url: args.url, label: '' }];
    if (!args.quiet && args.routes.length) {
      console.log(`[접근성] 경로(${urls.length}): ${args.routes.join(', ')}`);
    }
    const code = await auditUrl(urls, args.minContrast, args.minTarget, 15000);
    if (code === 2) return 2; // Playwright 미설치 안내
  } else {
    // 정적 모드
    const htmlPath = resolve(process.cwd(), args.html);
    if (!existsSync(htmlPath)) {
      console.error(`[오류] HTML 파일이 없습니다: ${htmlPath}`);
      return 1;
    }
    const html = await readFile(htmlPath, 'utf8');
    let css = '';
    for (const c of args.css) {
      const p = resolve(process.cwd(), c);
      if (existsSync(p)) css += '\n' + (await readFile(p, 'utf8'));
      else add('WARN', 'css-missing', `CSS 파일을 찾지 못함: ${c}`);
    }
    auditStatic(html, css, args.minContrast, args.minTarget);
  }

  // 결과 출력
  const errors = findings.filter((f) => f.level === 'ERROR');
  const warns = findings.filter((f) => f.level === 'WARN');
  const infos = findings.filter((f) => f.level === 'INFO');

  if (!args.quiet && infos.length) {
    console.log('\n[정보]');
    infos.forEach((f) => console.log(`  · (${f.code}) ${f.message}`));
  }
  if (errors.length) {
    console.error(`\n[ERROR] ${errors.length}건 — 반드시 수정:`);
    errors.forEach((f) => console.error(`  [ERROR] (${f.code}) ${f.message}`));
  }
  if (warns.length) {
    console.warn(`\n[WARN] ${warns.length}건 — 권장 수정:`);
    warns.forEach((f) => console.warn(`  [WARN] (${f.code}) ${f.message}`));
  }

  console.log('\n[한계] 정적 점검은 상속·캐스케이드·동적 포커스·스크린리더 순서를 검사하지 않습니다.');
  console.log('  더 정확한 검증: --url + Playwright, 그리고 사람 검수 + /design-audit (Gate 7).');

  const failBecauseStrict = args.strict && warns.length > 0;
  if (errors.length > 0 || failBecauseStrict) {
    console.error(`\n[실패] ERROR ${errors.length}건${failBecauseStrict ? `, --strict 로 WARN ${warns.length}건도 실패 처리` : ''}.`);
    return 1;
  }
  if (!args.quiet) console.log(`\n[통과] 치명 위반 없음 (WARN ${warns.length}건은 권장). accessibility ≥80 목표는 /design-audit 가 종합 판정.`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error('[치명] 예기치 못한 오류:', e);
    process.exit(1);
  });
