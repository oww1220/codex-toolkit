#!/usr/bin/env -S npx tsx
/**
 * export-selection.ts — compare/selection.json → design/selection.json 승격 (AI Design Director)
 *
 * BUILD CONTRACT §14 / §4.3 / §2(파이프라인 5단계 /design-select).
 * 사용자가 비교 앱에서 export 한 작업본(design/compare/selection.json)을 확정 승격본
 * (design/selection.json)으로 올린다. 이때:
 *   - 단일(selectedCandidate) vs 조합(combinedSelection) 의도 충돌을 요약한다.
 *   - 좋아요/싫어요 충돌(같은 후보·요소가 양쪽에)을 잡아낸다.
 *   - approvedAt 을 채워 "확정" 상태로 만든다(미승인 작업본은 빈 문자열).
 *   - DECISION-LOG.md 에 추가할 항목 초안을 stdout 에 출력한다(자동 기록 X — 판단은 사람 몫).
 *
 * "생성보다 판단"(CONTRACT §0 원칙 1): 이 스크립트는 사용자의 선택을 *승격*할 뿐,
 * 선택을 대신 만들지 않는다. --approve 없이는 approvedAt 을 채우지 않는다(자동 확정 금지).
 *
 * 사용법:
 *   npx tsx scripts/export-selection.ts [--in <경로>] [--out <경로>] [--approve] [--force] [--quiet]
 *
 *   --in       작업본 selection. 기본: design/compare/selection.json
 *   --out      승격 대상. 기본: design/selection.json
 *   --approve  approvedAt 을 현재 시각으로 채워 확정 처리(사용자 명시 승인일 때만)
 *   --force    --out 이 이미 존재해도 덮어쓰기
 *   --quiet    로그 최소화
 *   --help     도움말
 *
 * 종료코드: 입력 없음/형태 오류/충돌(치명) → 1, 정상 승격 → 0.
 * 의존성: Node18+ 표준 라이브러리만.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

// --------------------------------------------------------------------------
// 인자
// --------------------------------------------------------------------------
interface Args {
  in: string;
  out: string;
  approve: boolean;
  force: boolean;
  quiet: boolean;
  help: boolean;
}
function parseArgs(argv: string[]): Args {
  const a: Args = {
    in: 'design/compare/selection.json',
    out: 'design/selection.json',
    approve: false,
    force: false,
    quiet: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--help' || t === '-h') a.help = true;
    else if (t === '--approve') a.approve = true;
    else if (t === '--force') a.force = true;
    else if (t === '--quiet') a.quiet = true;
    else if (t === '--in') a.in = argv[++i] ?? a.in;
    else if (t === '--out') a.out = argv[++i] ?? a.out;
  }
  return a;
}

const HELP = `export-selection.ts — compare/selection.json → design/selection.json 승격

사용법:
  npx tsx scripts/export-selection.ts [--in <경로>] [--out <경로>] [--approve] [--force]

옵션:
  --in <경로>    작업본 (기본: design/compare/selection.json)
  --out <경로>   승격 대상 (기본: design/selection.json)
  --approve      approvedAt 을 현재 시각으로 채워 확정 (사용자 명시 승인 시에만)
  --force        --out 이 존재해도 덮어쓰기
  --quiet        로그 최소화
  --help, -h     이 도움말

동작:
  1) 작업본을 읽어 selection.schema.json 형태로 점검
  2) 단일/조합 선택 의도 충돌·좋아요/싫어요 충돌 요약
  3) (--approve 시) approvedAt 채움 — 없으면 작업본 값 유지(미승인이면 빈 문자열)
  4) design/selection.json 으로 저장
  5) DECISION-LOG.md 추가용 항목 초안을 stdout 출력 (자동 기록 X)`;

// --------------------------------------------------------------------------
// 타입 (selection.schema.json 정합)
// --------------------------------------------------------------------------
const CANDIDATE_IDS = ['candidate-a', 'candidate-b', 'candidate-c', 'candidate-d', 'candidate-e', 'candidate-f', 'candidate-g'];
const ELEMENTS = [
  'color', 'typography', 'navigation', 'density', 'buttons', 'forms', 'cards',
  'tables', 'modals', 'icons', 'spacing', 'radius', 'shadow', 'images', 'motion',
];

interface FeedbackEntry { candidate: string; element: string; note: string; }
interface Selection {
  selectedCandidate: string | null;
  combinedSelection: Record<string, string>;
  likes: FeedbackEntry[];
  dislikes: FeedbackEntry[];
  notes: string;
  approvedAt: string;
}

// --------------------------------------------------------------------------
// 경량 형태 점검 (selection.schema.json 핵심 제약)
// --------------------------------------------------------------------------
function validateShape(s: any): string[] {
  const errs: string[] = [];
  if (typeof s !== 'object' || s === null || Array.isArray(s)) {
    errs.push('최상위는 객체여야 합니다.');
    return errs;
  }
  // selectedCandidate
  if (s.selectedCandidate !== null && !CANDIDATE_IDS.includes(s.selectedCandidate)) {
    errs.push(`selectedCandidate 는 null 또는 candidate-a..g 여야 합니다 (현재: ${JSON.stringify(s.selectedCandidate)}).`);
  }
  // combinedSelection
  if (typeof s.combinedSelection !== 'object' || s.combinedSelection === null) {
    errs.push('combinedSelection 은 객체여야 합니다.');
  } else {
    for (const [el, cand] of Object.entries(s.combinedSelection)) {
      if (!ELEMENTS.includes(el)) errs.push(`combinedSelection 에 알 수 없는 요소: ${el} (15종 고정).`);
      if (!CANDIDATE_IDS.includes(cand as string)) errs.push(`combinedSelection.${el} 의 값이 후보 id 가 아닙니다: ${JSON.stringify(cand)}.`);
    }
  }
  // likes / dislikes
  for (const key of ['likes', 'dislikes'] as const) {
    if (!Array.isArray(s[key])) {
      errs.push(`${key} 는 배열이어야 합니다.`);
      continue;
    }
    s[key].forEach((e: any, i: number) => {
      if (!e || typeof e !== 'object') { errs.push(`${key}[${i}] 는 객체여야 합니다.`); return; }
      if (!CANDIDATE_IDS.includes(e.candidate)) errs.push(`${key}[${i}].candidate 가 후보 id 가 아닙니다: ${JSON.stringify(e.candidate)}.`);
      if (!ELEMENTS.includes(e.element)) errs.push(`${key}[${i}].element 가 15종 요소가 아닙니다: ${JSON.stringify(e.element)}.`);
      if (typeof e.note !== 'string') errs.push(`${key}[${i}].note 는 문자열이어야 합니다.`);
    });
  }
  if (typeof s.notes !== 'string') errs.push('notes 는 문자열이어야 합니다.');
  if (typeof s.approvedAt !== 'string') errs.push('approvedAt 은 문자열이어야 합니다(빈 문자열 또는 ISO date-time).');
  return errs;
}

// --------------------------------------------------------------------------
// 충돌·의도 요약
// --------------------------------------------------------------------------
interface Summary {
  mode: 'single' | 'combined' | 'mixed' | 'empty';
  notes: string[];
  conflicts: string[];
}
function summarize(s: Selection): Summary {
  const notes: string[] = [];
  const conflicts: string[] = [];
  const hasSingle = s.selectedCandidate !== null;
  const combinedKeys = Object.keys(s.combinedSelection ?? {});
  const hasCombined = combinedKeys.length > 0;

  let mode: Summary['mode'];
  if (hasSingle && hasCombined) {
    mode = 'mixed';
    conflicts.push(
      `단일 선택(selectedCandidate=${s.selectedCandidate})과 조합 선택(${combinedKeys.length}개 요소)이 동시에 지정됨. ` +
      '/design-select 가 어느 의도를 우선할지 사용자에게 확인해야 함(둘 다 두면 모호).',
    );
  } else if (hasSingle) {
    mode = 'single';
    notes.push(`단일 후보 전체 선택: ${s.selectedCandidate}.`);
  } else if (hasCombined) {
    mode = 'combined';
    const pairs = combinedKeys.map((k) => `${k}=${s.combinedSelection[k]}`).join(', ');
    notes.push(`조합 선택 ${combinedKeys.length}개 요소: ${pairs}.`);
    const missing = ELEMENTS.filter((e) => !combinedKeys.includes(e));
    if (missing.length > 0) {
      notes.push(`미지정 요소 ${missing.length}종(${missing.join(', ')}) — /design-select 가 베이스 후보 또는 design-profile 기본값으로 채워야 함.`);
    }
  } else {
    mode = 'empty';
    conflicts.push('단일·조합 어느 쪽도 지정되지 않음. 비교 앱에서 선택을 실제로 했는지 확인 필요.');
  }

  // 좋아요 ↔ 싫어요 충돌(같은 후보·요소가 양쪽에)
  const likeSet = new Set((s.likes ?? []).map((e) => `${e.candidate}|${e.element}`));
  for (const d of s.dislikes ?? []) {
    const key = `${d.candidate}|${d.element}`;
    if (likeSet.has(key)) {
      conflicts.push(`좋아요/싫어요 충돌: ${d.candidate} 의 ${d.element} 가 양쪽에 모두 있음 — 사용자 의도 재확인.`);
    }
  }

  // 조합 선택과 dislike 모순(조합으로 고른 요소를 동시에 싫어요)
  for (const d of s.dislikes ?? []) {
    if (s.combinedSelection?.[d.element] === d.candidate) {
      conflicts.push(`모순: ${d.element} 를 ${d.candidate} 에서 가져오기로 했는데 같은 (후보,요소)에 싫어요가 있음.`);
    }
  }

  return { mode, notes, conflicts };
}

// --------------------------------------------------------------------------
// DECISION-LOG.md 항목 초안 (CONTRACT §3 — /design-select 이후 임의 결정 기록)
// --------------------------------------------------------------------------
function decisionLogDraft(s: Selection, sum: Summary, now: string): string {
  const lines: string[] = [];
  lines.push(`### [${now.slice(0, 10)}] 디자인 선택 확정 (export-selection)`);
  lines.push('');
  lines.push(`- **선택 방식**: ${sum.mode === 'single' ? '단일 후보 전체' : sum.mode === 'combined' ? '요소 단위 조합' : sum.mode === 'mixed' ? '혼합(확인 필요)' : '미선택(확인 필요)'}`);
  if (s.selectedCandidate) lines.push(`- **단일 후보**: ${s.selectedCandidate}`);
  const ck = Object.keys(s.combinedSelection ?? {});
  if (ck.length) lines.push(`- **조합 요소**: ${ck.map((k) => `${k}→${s.combinedSelection[k]}`).join(', ')}`);
  if ((s.likes ?? []).length) lines.push(`- **좋아요 근거**: ${s.likes.map((l) => `${l.candidate}/${l.element}("${l.note || '메모없음'}")`).join('; ')}`);
  if ((s.dislikes ?? []).length) lines.push(`- **싫어요 근거**: ${s.dislikes.map((d) => `${d.candidate}/${d.element}("${d.note || '메모없음'}")`).join('; ')}`);
  if (s.notes) lines.push(`- **사용자 메모**: ${s.notes}`);
  if (sum.conflicts.length) {
    lines.push('- **해소 필요 충돌**:');
    sum.conflicts.forEach((c) => lines.push(`  - ${c}`));
  }
  lines.push(`- **확정 여부**: ${s.approvedAt ? `승인됨(${s.approvedAt})` : '미승인 — --approve 또는 /design-select 에서 사용자 승인 필요'}`);
  lines.push('');
  return lines.join('\n');
}

// --------------------------------------------------------------------------
// 메인
// --------------------------------------------------------------------------
async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return 0; }

  const inPath = resolve(process.cwd(), args.in);
  const outPath = resolve(process.cwd(), args.out);

  if (!existsSync(inPath)) {
    console.error(`[오류] 작업본 selection 이 없습니다: ${inPath}`);
    console.error('  비교 앱에서 "선택 내보내기"로 design/compare/selection.json 을 먼저 저장하세요(/design-compare).');
    return 1;
  }

  let raw: any;
  try {
    raw = JSON.parse(await readFile(inPath, 'utf8'));
  } catch (e) {
    console.error(`[오류] JSON 파싱 실패: ${inPath}\n  ${(e as Error).message}`);
    return 1;
  }

  const shapeErrors = validateShape(raw);
  if (shapeErrors.length) {
    console.error('[오류] selection 형태가 schemas/selection.schema.json 과 맞지 않습니다:');
    shapeErrors.forEach((e) => console.error(`  - ${e}`));
    return 1;
  }
  const s = raw as Selection;

  // 정규화(필수 필드 보강)
  s.combinedSelection ??= {};
  s.likes ??= [];
  s.dislikes ??= [];
  s.notes ??= '';
  s.approvedAt ??= '';

  const sum = summarize(s);

  if (!args.quiet) {
    console.log(`[승격] 입력: ${args.in}`);
    console.log(`[승격] 선택 방식: ${sum.mode}`);
    sum.notes.forEach((n) => console.log(`  · ${n}`));
  }
  if (sum.conflicts.length) {
    console.warn('\n[주의] 해소가 필요한 충돌/모호점:');
    sum.conflicts.forEach((c) => console.warn(`  ⚠ ${c}`));
  }
  // 빈 선택(empty)은 치명: 승격할 의미가 없음
  if (sum.mode === 'empty') {
    console.error('\n[실패] 단일·조합 어느 쪽도 선택되지 않았습니다. 비교 앱에서 선택을 마친 뒤 다시 export 하세요.');
    return 1;
  }

  // approvedAt 처리 — 자동 확정 금지
  const now = new Date().toISOString();
  if (args.approve) {
    s.approvedAt = now;
    if (!args.quiet) console.log(`\n[확정] --approve: approvedAt = ${now}`);
  } else if (!args.quiet) {
    console.log(`\n[안내] --approve 없음 → approvedAt 은 작업본 값 유지("${s.approvedAt}"). 자동 확정하지 않습니다.`);
  }

  // 출력 충돌
  if (existsSync(outPath) && !args.force) {
    console.error(`\n[오류] 승격 대상이 이미 존재합니다: ${outPath}`);
    console.error('  덮어쓰려면 --force 를 붙이세요(기존 확정본을 덮습니다).');
    return 1;
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(s, null, 2) + '\n', 'utf8');
  if (!args.quiet) console.log(`\n[완료] 승격 저장: ${args.out}`);

  // DECISION-LOG 초안 — stdout 으로만(자동 기록 X)
  console.log('\n──────────────────────────────────────────────');
  console.log('DECISION-LOG.md 에 추가할 항목 초안 (아래 블록을 design/DECISION-LOG.md 에 붙여넣으세요):');
  console.log('──────────────────────────────────────────────');
  console.log(decisionLogDraft(s, sum, now));

  // 충돌이 남아 있으면 사용자에게 신호하되, 승격 자체는 됐으므로 0(충돌은 /design-select 가 사용자와 해소)
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error('[치명] 예기치 못한 오류:', e);
    process.exit(1);
  });
