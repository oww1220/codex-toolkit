#!/usr/bin/env -S npx tsx
/**
 * validate-tokens.ts — design/TOKENS.json 검증기 (AI Design Director)
 *
 * BUILD CONTRACT §14 / §4.4 / §5 / §1.
 * TOKENS.json 은 색상·간격·폰트·모서리의 단일 출처(single source of truth)다. 이 스크립트는
 * 그 파일이 schemas/tokens.schema.json 의 형태를 만족하는지 + AI slop(임의 색·순수 #000/#fff·
 * 누락 토큰 그룹)을 범하지 않았는지 점검한다.
 *
 * 검사 3축:
 *   1) 구조 검증 — schemas/tokens.schema.json (ajv 가 있으면 ajv, 없으면 경량 자체 검증으로 폴백)
 *   2) 필수 토큰 그룹 누락 — §5 표 기준(color/typography 하위그룹 + spacing/radius/shadow ...)
 *   3) AI slop 색상 — 순수 #000/#fff, Tailwind 기본 blue/violet 하드코드(#3B82F6 등), CSS named black/white
 *
 * 사용법:
 *   npx tsx scripts/validate-tokens.ts [--file <경로>] [--schema <경로>] [--strict] [--quiet]
 *
 *   --file    검증할 토큰 파일. 기본: design/TOKENS.json
 *   --schema  JSON Schema 파일. 기본: schemas/tokens.schema.json (이 레포 기준 상대탐색)
 *   --strict  경고(WARN)도 실패(exit 1)로 취급
 *   --quiet   통과 시 로그 최소화
 *   --help    도움말
 *
 * 종료코드: 위반(ERROR) 1건 이상 → 1, --strict 에서 WARN 존재 → 1, 그 외 → 0.
 * 의존성: Node18+ 표준 라이브러리. ajv 는 있으면 동적 import, 없으면 자체 검증으로 graceful fallback.
 *         환상 의존성 import 금지 — 미설치 시 안내만 하고 자체 검증으로 진행.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

// --------------------------------------------------------------------------
// 인자 파싱
// --------------------------------------------------------------------------
interface Args {
  file: string;
  schema: string;
  strict: boolean;
  quiet: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    file: 'design/TOKENS.json',
    schema: '',
    strict: false,
    quiet: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--help' || t === '-h') a.help = true;
    else if (t === '--strict') a.strict = true;
    else if (t === '--quiet') a.quiet = true;
    else if (t === '--file') a.file = argv[++i] ?? a.file;
    else if (t === '--schema') a.schema = argv[++i] ?? a.schema;
    else if (!t.startsWith('-') && a.file === 'design/TOKENS.json') a.file = t;
  }
  return a;
}

const HELP = `validate-tokens.ts — design/TOKENS.json 검증기

사용법:
  npx tsx scripts/validate-tokens.ts [--file <경로>] [--schema <경로>] [--strict] [--quiet]

옵션:
  --file <경로>    검증할 토큰 파일 (기본: design/TOKENS.json)
  --schema <경로>  JSON Schema (기본: schemas/tokens.schema.json)
  --strict         경고도 실패로 취급
  --quiet          통과 시 로그 최소화
  --help, -h       이 도움말

검사:
  1) 구조      — schemas/tokens.schema.json (ajv 있으면 ajv, 없으면 자체 검증)
  2) 누락 그룹 — color.{background,surface,text,border,accent,semantic}, typography.*, spacing, radius, shadow ...
  3) AI slop   — 순수 #000/#fff, Tailwind 기본 blue/violet 하드코드, named black/white

종료코드: ERROR ≥1 → 1, --strict 에서 WARN 존재 → 1, 통과 → 0`;

// --------------------------------------------------------------------------
// 진단 수집
// --------------------------------------------------------------------------
type Level = 'ERROR' | 'WARN';
interface Finding {
  level: Level;
  code: string;
  path: string; // 토큰 경로 (예: color.accent.default)
  message: string;
}
const findings: Finding[] = [];
const add = (level: Level, code: string, path: string, message: string) =>
  findings.push({ level, code, path, message });

// --------------------------------------------------------------------------
// 색상 AI slop 사전 (CONTRACT §1 자가검열)
// --------------------------------------------------------------------------
// 순수 검정/흰색 (3/4/6/8 자리 hex, 대소문자 무관)
const PURE_BLACK = /^#(000|0000|000000|000000ff)$/i;
const PURE_WHITE = /^#(fff|ffff|ffffff|ffffffff)$/i;
// CSS named colors 중 순수 흑백 / 진부 기본색
const NAMED_BANNED: Record<string, string> = {
  black: '순수 black — accent hue 를 살짝 띤 off-black 으로 tint',
  white: '순수 white — accent 톤을 살짝 띤 off-white',
};
// Tailwind 기본 팔레트(그대로 박으면 진부) — 대표 hue 의 핵심 셰이드들
const TAILWIND_DEFAULT: Record<string, string> = {
  '#3b82f6': 'Tailwind blue-500',
  '#2563eb': 'Tailwind blue-600',
  '#60a5fa': 'Tailwind blue-400',
  '#1d4ed8': 'Tailwind blue-700',
  '#8b5cf6': 'Tailwind violet-500',
  '#7c3aed': 'Tailwind violet-600',
  '#a78bfa': 'Tailwind violet-400',
  '#6366f1': 'Tailwind indigo-500',
  '#4f46e5': 'Tailwind indigo-600',
  // 흔한 회색 하드코드(토큰화 안 한 신호)
  '#333': '하드코드 회색 #333 — 토큰화된 text/border 사용',
  '#333333': '하드코드 회색 #333 — 토큰화된 text/border 사용',
  '#666': '하드코드 회색 #666 — 토큰화된 text 사용',
  '#666666': '하드코드 회색 #666 — 토큰화된 text 사용',
};

function inspectColorValue(path: string, raw: string): void {
  const v = raw.trim();
  const lower = v.toLowerCase();
  // hex 정규화 (#abc → 비교는 원형, 사전 키는 소문자)
  if (PURE_BLACK.test(v)) {
    add('ERROR', 'pure-black', path, `순수 검정(${v}) 금지 — #08060D 등 accent hue 로 tint 한 off-black 사용.`);
    return;
  }
  if (PURE_WHITE.test(v)) {
    add('ERROR', 'pure-white', path, `순수 흰색(${v}) 금지 — accent 톤을 살짝 띤 off-white 사용.`);
    return;
  }
  if (NAMED_BANNED[lower]) {
    add('ERROR', 'named-pure', path, `${NAMED_BANNED[lower]} (값: ${v}).`);
    return;
  }
  if (TAILWIND_DEFAULT[lower]) {
    add('WARN', 'tailwind-default', path, `${TAILWIND_DEFAULT[lower]} 를 그대로 사용(${v}) — 선택된 디자인 방향의 고유색으로 교체 권장.`);
  }
}

// --------------------------------------------------------------------------
// 색상 그룹 순회 — color.* 하위의 모든 문자열 값을 색상으로 간주해 점검
// --------------------------------------------------------------------------
function walkColors(node: unknown, path: string): void {
  if (node == null) return;
  if (typeof node === 'string') {
    inspectColorValue(path, node);
    return;
  }
  if (typeof node === 'object') {
    for (const [k, val] of Object.entries(node as Record<string, unknown>)) {
      walkColors(val, path ? `${path}.${k}` : k);
    }
  }
}

// --------------------------------------------------------------------------
// 누락 토큰 그룹 점검 (CONTRACT §5 표)
// --------------------------------------------------------------------------
const REQUIRED_COLOR_SUBGROUPS = ['background', 'surface', 'text', 'border', 'accent', 'semantic'];
const REQUIRED_TYPO_SUBGROUPS = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];
const REQUIRED_TOP_GROUPS = ['color', 'typography', 'spacing', 'radius', 'shadow'];
// 권장(없으면 WARN) — §5 표에 있으나 schema required 아님
const RECOMMENDED_TOP_GROUPS = ['borderWidth', 'breakpoint', 'motion', 'zIndex'];

function checkMissingGroups(tokens: Record<string, unknown>): void {
  for (const g of REQUIRED_TOP_GROUPS) {
    if (!(g in tokens)) add('ERROR', 'missing-group', g, `필수 토큰 그룹 누락: ${g}`);
  }
  const color = tokens.color as Record<string, unknown> | undefined;
  if (color && typeof color === 'object') {
    for (const sg of REQUIRED_COLOR_SUBGROUPS) {
      if (!(sg in color)) add('ERROR', 'missing-color-subgroup', `color.${sg}`, `필수 색상 하위그룹 누락: color.${sg}`);
    }
  }
  const typo = tokens.typography as Record<string, unknown> | undefined;
  if (typo && typeof typo === 'object') {
    for (const sg of REQUIRED_TYPO_SUBGROUPS) {
      if (!(sg in typo)) add('ERROR', 'missing-typo-subgroup', `typography.${sg}`, `필수 타이포 하위그룹 누락: typography.${sg}`);
    }
    // display/body 폰트 분리 권장
    const ff = typo.fontFamily as Record<string, unknown> | undefined;
    if (ff && typeof ff === 'object' && (!('display' in ff) || !('body' in ff))) {
      add('WARN', 'font-pair', 'typography.fontFamily', 'display + body 폰트 쌍 분리 권장 (display 800+, body 400~500).');
    }
  }
  for (const g of RECOMMENDED_TOP_GROUPS) {
    if (!(g in tokens)) add('WARN', 'missing-recommended', g, `권장 토큰 그룹 없음: ${g} (CONTRACT §5).`);
  }
}

// --------------------------------------------------------------------------
// 경량 자체 구조 검증 (ajv 미설치 폴백)
//   — tokens.schema.json 의 핵심 제약만 검사: required 그룹/하위그룹, 토큰 값이 비어있지 않은 문자열.
// --------------------------------------------------------------------------
function lightStructuralCheck(tokens: Record<string, unknown>): void {
  // 토큰 그룹의 값이 모두 non-empty string 인지 (tokenGroup / tokenValue 제약)
  const checkGroup = (node: unknown, path: string) => {
    if (node == null || typeof node !== 'object') {
      add('ERROR', 'group-shape', path, `토큰 그룹은 객체여야 한다: ${path}`);
      return;
    }
    const entries = Object.entries(node as Record<string, unknown>);
    if (entries.length === 0) add('ERROR', 'group-empty', path, `토큰 그룹이 비어 있다: ${path}`);
    for (const [k, v] of entries) {
      if (typeof v === 'string') {
        if (v.trim().length === 0) add('ERROR', 'empty-value', `${path}.${k}`, `토큰 값이 빈 문자열: ${path}.${k}`);
      } else if (v && typeof v === 'object') {
        checkGroup(v, `${path}.${k}`); // semantic.* 처럼 중첩 허용
      } else {
        add('ERROR', 'value-shape', `${path}.${k}`, `토큰 값은 문자열이어야 한다: ${path}.${k} (현재 ${typeof v}).`);
      }
    }
  };
  const color = tokens.color as Record<string, unknown> | undefined;
  if (color) for (const sg of REQUIRED_COLOR_SUBGROUPS) if (sg in color) checkGroup(color[sg], `color.${sg}`);
  const typo = tokens.typography as Record<string, unknown> | undefined;
  if (typo) for (const sg of REQUIRED_TYPO_SUBGROUPS) if (sg in typo) checkGroup(typo[sg], `typography.${sg}`);
  for (const g of ['spacing', 'radius', 'shadow', 'borderWidth', 'zIndex']) {
    if (g in tokens) checkGroup(tokens[g], g);
  }
  // motion.duration / motion.easing
  const motion = tokens.motion as Record<string, unknown> | undefined;
  if (motion && typeof motion === 'object') {
    for (const sg of ['duration', 'easing']) if (sg in motion) checkGroup(motion[sg], `motion.${sg}`);
  }
}

// --------------------------------------------------------------------------
// ajv 동적 검증 (있으면) — graceful fallback
// --------------------------------------------------------------------------
async function tryAjvValidate(tokens: unknown, schema: unknown): Promise<{ ran: boolean; errors: string[] }> {
  try {
    // @ts-ignore — 선택 의존성: 미설치 시 catch 로 폴백
    const ajvMod: any = await import('ajv');
    const Ajv = ajvMod.default ?? ajvMod.Ajv ?? ajvMod;
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema as object);
    const ok = validate(tokens);
    if (ok) return { ran: true, errors: [] };
    const errs = (validate.errors ?? []).map((e: any) => `${e.instancePath || '(root)'} ${e.message}`);
    return { ran: true, errors: errs };
  } catch {
    return { ran: false, errors: [] };
  }
}

// --------------------------------------------------------------------------
// 메인
// --------------------------------------------------------------------------
function resolveSchemaPath(explicit: string): string {
  if (explicit) return resolve(process.cwd(), explicit);
  // 레포 기준 → 작업디렉토리 기준 순으로 탐색
  const candidates = [
    join(REPO_ROOT, 'schemas', 'tokens.schema.json'),
    resolve(process.cwd(), 'schemas/tokens.schema.json'),
  ];
  return candidates.find((p) => existsSync(p)) ?? candidates[0];
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return 0;
  }

  const filePath = resolve(process.cwd(), args.file);
  if (!existsSync(filePath)) {
    console.error(`[오류] 토큰 파일이 없습니다: ${filePath}`);
    console.error('  /design-system 단계가 design/TOKENS.json 을 먼저 생성해야 합니다.');
    return 1;
  }

  let tokens: Record<string, unknown>;
  try {
    tokens = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (e) {
    console.error(`[오류] JSON 파싱 실패: ${filePath}`);
    console.error(`  ${(e as Error).message}`);
    return 1;
  }
  if (typeof tokens !== 'object' || tokens === null || Array.isArray(tokens)) {
    console.error('[오류] TOKENS.json 의 최상위는 객체여야 합니다.');
    return 1;
  }

  if (!args.quiet) console.log(`[검증] 대상: ${args.file}`);

  // 1) 스키마 구조 검증 (ajv → 폴백)
  const schemaPath = resolveSchemaPath(args.schema);
  let schemaNote = '';
  if (existsSync(schemaPath)) {
    try {
      const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
      const ajvRes = await tryAjvValidate(tokens, schema);
      if (ajvRes.ran) {
        schemaNote = 'ajv';
        for (const e of ajvRes.errors) add('ERROR', 'schema', '(schema)', e);
      } else {
        schemaNote = '자체 검증(ajv 미설치)';
        lightStructuralCheck(tokens);
      }
    } catch {
      schemaNote = '자체 검증(스키마 로드 실패)';
      lightStructuralCheck(tokens);
    }
  } else {
    schemaNote = `자체 검증(스키마 파일 없음: ${schemaPath})`;
    lightStructuralCheck(tokens);
  }
  if (!args.quiet) console.log(`[검증] 구조: ${schemaNote}`);

  // 2) 누락 토큰 그룹
  checkMissingGroups(tokens);

  // 3) AI slop 색상 — color.* 만 색상으로 간주
  if (tokens.color) walkColors(tokens.color, 'color');

  // --------------------------------------------------------------------
  // 결과 출력
  // --------------------------------------------------------------------
  const errors = findings.filter((f) => f.level === 'ERROR');
  const warns = findings.filter((f) => f.level === 'WARN');

  if (findings.length === 0) {
    if (!args.quiet) console.log('[통과] TOKENS.json 위반 없음. 구조·토큰 그룹·색상 모두 OK.');
    return 0;
  }

  const fmt = (f: Finding) => `  [${f.level}] (${f.code}) ${f.path}: ${f.message}`;
  if (errors.length) {
    console.error(`\n[ERROR] ${errors.length}건 — 반드시 수정:`);
    errors.forEach((f) => console.error(fmt(f)));
  }
  if (warns.length) {
    console.warn(`\n[WARN] ${warns.length}건 — 권장 수정:`);
    warns.forEach((f) => console.warn(fmt(f)));
  }

  const failBecauseStrict = args.strict && warns.length > 0;
  if (errors.length > 0 || failBecauseStrict) {
    console.error(
      `\n[실패] ERROR ${errors.length}건${failBecauseStrict ? `, --strict 로 WARN ${warns.length}건도 실패 처리` : ''}.`,
    );
    return 1;
  }
  console.log(`\n[통과] ERROR 0건 (WARN ${warns.length}건은 권장사항). --strict 로 엄격 검사 가능.`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error('[치명] 예기치 못한 오류:', e);
    process.exit(1);
  });
