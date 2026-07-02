#!/usr/bin/env -S npx tsx
/**
 * create-comparison.ts — 비교 데이터 시드 + compare-ui 스캐폴드 복사 (AI Design Director)
 *
 * BUILD CONTRACT §14 / §13 / §4.2 / §3 / §0(원칙 4 "동일 조건 비교").
 * /design-research 가 만든 design/research/references.json 을 읽어, /design-compare 비교 앱이
 * 사용할 두 데이터 파일을 시드한다:
 *   - design/compare/data/content.json     ... 모든 후보가 공유하는 *단일* 콘텐츠(불변식)
 *   - design/compare/data/candidates.json  ... 후보별 *디자인 토큰만* (콘텐츠 절대 미포함)
 * 그리고 이 레포의 compare-ui/ 스캐폴드를 사용자 프로젝트 design/compare/ 로 복사한다.
 *
 * 불변식(이게 깨지면 비교가 무의미 — CONTRACT §13):
 *   - content.json 은 후보와 무관한 단일 콘텐츠 소스. 후보별로 갈라지지 않는다.
 *   - candidates.json 의 각 후보는 토큰/스타일만 담는다(문장·데이터 금지).
 *   - 후보 id·name 은 references.json 과 정합한다.
 *
 * 토큰 시드는 references.json 의 keywords/apply/expectedImpression 에서 *추정*해 만든다(휴리스틱).
 * 추정값이며 최종 단일 출처는 design/TOKENS.json(/design-system). 후보들이 서로 충분히 구별되도록
 * 키워드 신호로 5개 아키타입(Warm Editorial / Compact Productivity / Minimal Monochrome /
 * Friendly Consumer / Technical Industrial)에 매핑한다.
 *
 * 사용법:
 *   npx tsx scripts/create-comparison.ts [--project <명>] [--references <경로>] [--out <design루트>]
 *     [--product-type crm|content|commerce|admin|mobile] [--no-scaffold] [--force] [--quiet]
 *
 * 종료코드: 입력 없음/형태 오류 → 1, 정상 → 0.
 * 의존성: Node18+ 표준 라이브러리만(fs/promises, path). 환상 의존성 없음.
 */

import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

// --------------------------------------------------------------------------
// 인자
// --------------------------------------------------------------------------
interface Args {
  project: string;
  references: string;
  outRoot: string; // design 루트
  productType: string;
  scaffold: boolean;
  force: boolean;
  quiet: boolean;
  help: boolean;
}
function parseArgs(argv: string[]): Args {
  const a: Args = {
    project: '',
    references: 'design/research/references.json',
    outRoot: 'design',
    productType: '',
    scaffold: true,
    force: false,
    quiet: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--help' || t === '-h') a.help = true;
    else if (t === '--no-scaffold') a.scaffold = false;
    else if (t === '--force') a.force = true;
    else if (t === '--quiet') a.quiet = true;
    else if (t === '--project') a.project = argv[++i] ?? '';
    else if (t === '--references') a.references = argv[++i] ?? a.references;
    else if (t === '--out') a.outRoot = argv[++i] ?? a.outRoot;
    else if (t === '--product-type') a.productType = argv[++i] ?? '';
  }
  return a;
}

const HELP = `create-comparison.ts — 비교 데이터 시드 + compare-ui 스캐폴드 복사

사용법:
  npx tsx scripts/create-comparison.ts [--project <명>] [--references <경로>] [--out <design루트>]
    [--product-type crm|content|commerce|admin|mobile] [--no-scaffold] [--force]

옵션:
  --project <명>        프로젝트명 (기본: references.json 의 project)
  --references <경로>   입력 (기본: design/research/references.json)
  --out <design루트>    출력 루트 (기본: design)
  --product-type <t>    대표 화면 세트 선택. 없으면 후보 키워드로 추정
  --no-scaffold         데이터만 시드, compare-ui 스캐폴드 복사 생략
  --force               기존 data/*.json 덮어쓰기
  --quiet               로그 최소화
  --help, -h            이 도움말

산출:
  <out>/compare/data/content.json        모든 후보 공통 콘텐츠 (불변식)
  <out>/compare/data/candidates.json     후보별 토큰만
  <out>/compare/public/data/{...}        앱 fetch 용 사본
  <out>/compare/ (스캐폴드)               compare-ui/ 복사본 (--no-scaffold 면 생략)

주의: 토큰은 references.json 에서 *추정*한 시드입니다. 최종 단일 출처는 design/TOKENS.json.`;

// --------------------------------------------------------------------------
// references.json 타입(부분) — references.schema.json 정합
// --------------------------------------------------------------------------
interface RefCandidate {
  id: string;
  name: string;
  source: { name: string; url: string };
  category: string;
  keywords: string[];
  recommendedFor: string[];
  strengths?: string[];
  risks: string[];
  apply: string[];
  doNotApply?: string[];
  expectedImpression: string;
}
interface References {
  project: string;
  generatedAt?: string;
  candidates: RefCandidate[];
}

// --------------------------------------------------------------------------
// 토큰 아키타입 — 후보들이 서로 충분히 구별되도록 5종 시드.
//   각 시드는 compare-ui/src/types.ts 의 Candidate 토큰 그룹(ColorScheme light+dark /
//   TypographyTokens / ShapeTokens / SpacingTokens / LayoutTokens / MotionTokens)을 *완전히* 채운다.
//   AI slop 자가검열(CONTRACT §1): 순수 #000/#fff 금지, Tailwind 기본 blue/violet 그대로 금지,
//   accent 1색 원칙. 색은 살짝 톤을 띤 off-black/off-white.
//   값은 compare-ui/public/data/candidates.json(스캐폴드 정답 샘플)을 단일 출처로 정렬했다.
// --------------------------------------------------------------------------

// src/types.ts 의 토큰 인터페이스를 스크립트 내부에 미러링(구조 잠금용).
interface ColorScheme {
  bgBase: string; bgSubtle: string; bgMuted: string;
  surfaceDefault: string; surfaceRaised: string; surfaceSunken: string;
  textPrimary: string; textSecondary: string; textMuted: string; textInverse: string;
  borderDefault: string; borderStrong: string; borderSubtle: string;
  accentDefault: string; accentHover: string; accentSubtle: string; accentContrast: string;
  success: string; successSurface: string;
  warning: string; warningSurface: string;
  danger: string; dangerSurface: string;
  info: string; infoSurface: string;
}
interface TypographyTokens {
  fontDisplay: string; fontBody: string; fontMono: string;
  baseSize: number; scale: number; displayWeight: number; bodyWeight: number;
  headingTracking: number; bodyLineHeight: number;
}
interface ShapeTokens {
  radius: number; radiusLarge: number; borderWidth: number;
  shadow: 'none' | 'subtle' | 'medium' | 'strong';
}
interface SpacingTokens {
  density: 'compact' | 'comfortable' | 'spacious';
  unit: number;
}
interface LayoutTokens {
  navigation: 'persistent-left-sidebar' | 'compact-icon-rail' | 'top-bar' | 'top-bar-with-subnav';
  contentWidth: 'fixed' | 'adaptive' | 'fluid';
  listStyle: 'table' | 'cards' | 'rows';
}
interface MotionTokens {
  level: 'none' | 'minimal' | 'moderate' | 'expressive';
  durationMs: number;
}

interface TokenSeed {
  /** 후보 이름 (references 후보에 이름이 비면 fallback). */
  name: string;
  /** 한 줄 인상 키워드 — references 후보 keywords 가 비면 fallback. */
  keywords: string[];
  /** 왜/어디에 추천되는지 한 문장 — Candidate.recommendReason fallback. */
  recommendReason: string;
  /** 어떤 인상인지 설명 — Candidate.description. */
  description: string;
  color: { light: ColorScheme; dark: ColorScheme };
  typography: TypographyTokens;
  shape: ShapeTokens;
  spacing: SpacingTokens;
  layout: LayoutTokens;
  motion: MotionTokens;
}

const ARCHETYPES: Record<string, TokenSeed> = {
  'warm-editorial': {
    name: 'Warm Editorial',
    keywords: ['따뜻한 중성', '에디토리얼', '절제된 장식', '높은 가독성'],
    recommendReason: '오래 들여다봐도 피로하지 않은 따뜻한 종이 톤. 본문 가독성과 차분한 위계가 중요할 때.',
    description: '웜 뉴트럴 배경에 잉크빛 텍스트, 절제된 테라코타 강조. 세리프 디스플레이 + 휴머니스트 본문으로 신문·잡지의 읽는 인상.',
    color: {
      light: {
        bgBase: '#F7F3EC', bgSubtle: '#F1EBE0', bgMuted: '#E8E0D2',
        surfaceDefault: '#FCFAF5', surfaceRaised: '#FFFFFB', surfaceSunken: '#F1EADE',
        textPrimary: '#2A241C', textSecondary: '#5A5044', textMuted: '#8A7E6E', textInverse: '#FBF7EF',
        borderDefault: '#DAD0BE', borderStrong: '#C3B6A0', borderSubtle: '#EAE2D3',
        accentDefault: '#B4532A', accentHover: '#9A4422', accentSubtle: '#F3E2D6', accentContrast: '#FBF4ED',
        success: '#4F6B3E', successSurface: '#E6EDDC', warning: '#9A6B19', warningSurface: '#F4E8CF',
        danger: '#A83A2E', dangerSurface: '#F3DDD7', info: '#3D6173', infoSurface: '#DDEAEF',
      },
      dark: {
        bgBase: '#211C16', bgSubtle: '#28221B', bgMuted: '#332C23',
        surfaceDefault: '#2A2419', surfaceRaised: '#342D20', surfaceSunken: '#1E1913',
        textPrimary: '#F0E7D6', textSecondary: '#C9BCA4', textMuted: '#998C75', textInverse: '#211C16',
        borderDefault: '#473D2E', borderStrong: '#5E5139', borderSubtle: '#372F23',
        accentDefault: '#D98A5C', accentHover: '#E89E70', accentSubtle: '#3D2C1F', accentContrast: '#241B12',
        success: '#9BBE7E', successSurface: '#2C3322', warning: '#D7A94F', warningSurface: '#352B16',
        danger: '#E08272', dangerSurface: '#3A241F', info: '#7FA9BC', infoSurface: '#1E2C33',
      },
    },
    typography: {
      fontDisplay: "'Iowan Old Style', 'Apple Garamond', Georgia, 'Noto Serif KR', serif",
      fontBody: "'Inter', -apple-system, 'Pretendard', 'Noto Sans KR', sans-serif",
      fontMono: "'IBM Plex Mono', 'SFMono-Regular', monospace",
      baseSize: 15, scale: 1.28, displayWeight: 800, bodyWeight: 440,
      headingTracking: -0.012, bodyLineHeight: 1.62,
    },
    shape: { radius: 6, radiusLarge: 10, borderWidth: 1, shadow: 'subtle' },
    spacing: { density: 'comfortable', unit: 6 },
    layout: { navigation: 'persistent-left-sidebar', contentWidth: 'fixed', listStyle: 'table' },
    motion: { level: 'minimal', durationMs: 180 },
  },
  'compact-productivity': {
    name: 'Compact Productivity',
    keywords: ['조밀', '테이블 우선', '빠른 스캔', '키보드 친화'],
    recommendReason: '한 화면에 더 많은 정보를 빠르게 스캔·처리해야 하는 헤비 유저 업무 도구에 맞음.',
    description: '조밀한 간격, 각진 표면, 차분한 청록 강조. 아이콘 레일 + 테이블 중심으로 데이터 밀도를 최대화.',
    color: {
      light: {
        bgBase: '#F4F6F6', bgSubtle: '#ECEFEF', bgMuted: '#E0E5E5',
        surfaceDefault: '#FCFDFD', surfaceRaised: '#FDFEFE', surfaceSunken: '#EEF1F1',
        textPrimary: '#19211F', textSecondary: '#48524F', textMuted: '#79827F', textInverse: '#F6FAF9',
        borderDefault: '#D2D9D8', borderStrong: '#B4BFBD', borderSubtle: '#E4E9E8',
        accentDefault: '#0E7C77', accentHover: '#0A6661', accentSubtle: '#D6ECEA', accentContrast: '#F2FBFA',
        success: '#1E7A4D', successSurface: '#DBEFE3', warning: '#9A6A10', warningSurface: '#F2E6C9',
        danger: '#B23A36', dangerSurface: '#F4DCDA', info: '#1F6585', infoSurface: '#D7E7EE',
      },
      dark: {
        bgBase: '#161B1A', bgSubtle: '#1C2221', bgMuted: '#26302E',
        surfaceDefault: '#1E2524', surfaceRaised: '#27302E', surfaceSunken: '#141918',
        textPrimary: '#E7EDEB', textSecondary: '#A9B4B1', textMuted: '#71807C', textInverse: '#161B1A',
        borderDefault: '#323D3B', borderStrong: '#46534F', borderSubtle: '#28312F',
        accentDefault: '#2BB7AE', accentHover: '#43C9C0', accentSubtle: '#16312E', accentContrast: '#10201E',
        success: '#4FC183', successSurface: '#16291F', warning: '#D6A647', warningSurface: '#322811',
        danger: '#E27C77', dangerSurface: '#37201F', info: '#5FA7C5', infoSurface: '#172A33',
      },
    },
    typography: {
      fontDisplay: "'Inter', 'Pretendard', 'Noto Sans KR', sans-serif",
      fontBody: "'Inter', 'Pretendard', 'Noto Sans KR', sans-serif",
      fontMono: "'JetBrains Mono', 'SFMono-Regular', monospace",
      baseSize: 13, scale: 1.18, displayWeight: 800, bodyWeight: 460,
      headingTracking: -0.006, bodyLineHeight: 1.45,
    },
    shape: { radius: 3, radiusLarge: 5, borderWidth: 1, shadow: 'subtle' },
    spacing: { density: 'compact', unit: 4 },
    layout: { navigation: 'compact-icon-rail', contentWidth: 'fluid', listStyle: 'table' },
    motion: { level: 'minimal', durationMs: 120 },
  },
  'minimal-monochrome': {
    name: 'Minimal Monochrome',
    keywords: ['흑백 절제', '강한 위계', '넉넉한 여백', '단색 강조'],
    recommendReason: '장식을 걷어내고 타이포 위계와 여백만으로 정돈된 인상을 줄 때. 강조색 1색 원칙.',
    description: '거의 무채색 팔레트에 단 하나의 절제된 강조. 강한 디스플레이 위계와 넉넉한 여백으로 고요한 집중.',
    color: {
      light: {
        bgBase: '#F6F6F5', bgSubtle: '#EFEFEE', bgMuted: '#E4E4E2',
        surfaceDefault: '#FCFCFB', surfaceRaised: '#FEFEFD', surfaceSunken: '#F0F0EE',
        textPrimary: '#17171A', textSecondary: '#46464B', textMuted: '#7C7C82', textInverse: '#F8F8F7',
        borderDefault: '#D8D8D4', borderStrong: '#B8B8B2', borderSubtle: '#E8E8E5',
        accentDefault: '#1C1C20', accentHover: '#000208', accentSubtle: '#E5E5E2', accentContrast: '#F8F8F7',
        success: '#3F7050', successSurface: '#E3ECE5', warning: '#8A6A22', warningSurface: '#EEE7D2',
        danger: '#9E3B36', dangerSurface: '#EFDEDC', info: '#3C5566', infoSurface: '#E0E7EB',
      },
      dark: {
        bgBase: '#161618', bgSubtle: '#1D1D20', bgMuted: '#28282C',
        surfaceDefault: '#1F1F22', surfaceRaised: '#28282C', surfaceSunken: '#141416',
        textPrimary: '#EDEDEC', textSecondary: '#B0B0B2', textMuted: '#76767A', textInverse: '#161618',
        borderDefault: '#34343A', borderStrong: '#4A4A52', borderSubtle: '#28282E',
        accentDefault: '#F0F0EE', accentHover: '#FFFFFD', accentSubtle: '#2E2E34', accentContrast: '#161618',
        success: '#7FB792', successSurface: '#1C2922', warning: '#CBA257', warningSurface: '#2E2614',
        danger: '#D9817C', dangerSurface: '#33211F', info: '#7F9DB3', infoSurface: '#1C2A33',
      },
    },
    typography: {
      fontDisplay: "'Inter Tight', 'Inter', 'Pretendard', 'Noto Sans KR', sans-serif",
      fontBody: "'Inter', 'Pretendard', 'Noto Sans KR', sans-serif",
      fontMono: "'IBM Plex Mono', 'SFMono-Regular', monospace",
      baseSize: 15, scale: 1.34, displayWeight: 820, bodyWeight: 420,
      headingTracking: -0.02, bodyLineHeight: 1.58,
    },
    shape: { radius: 0, radiusLarge: 2, borderWidth: 1, shadow: 'none' },
    spacing: { density: 'spacious', unit: 8 },
    layout: { navigation: 'top-bar', contentWidth: 'fixed', listStyle: 'rows' },
    motion: { level: 'minimal', durationMs: 200 },
  },
  'friendly-consumer': {
    name: 'Friendly Consumer',
    keywords: ['부드러운', '둥근 모서리', '친근한 색', '접근 쉬움'],
    recommendReason: '처음 쓰는 사용자도 편안하게 느끼도록 둥글고 따뜻한 인상이 필요할 때. 카드 중심.',
    description: '부드러운 라운드, 산호빛 강조, 가벼운 그림자. 카드 위주 배치로 친근하고 접근하기 쉬운 인상.',
    color: {
      light: {
        bgBase: '#FAF6F4', bgSubtle: '#F4EDEA', bgMuted: '#EDE2DD',
        surfaceDefault: '#FFFDFC', surfaceRaised: '#FFFEFD', surfaceSunken: '#F5ECE8',
        textPrimary: '#2C2320', textSecondary: '#5E4F49', textMuted: '#917F77', textInverse: '#FFF8F5',
        borderDefault: '#E7D8D1', borderStrong: '#D4BEB4', borderSubtle: '#F0E5E0',
        accentDefault: '#E0613F', accentHover: '#C94E2E', accentSubtle: '#FBE2D9', accentContrast: '#FFF6F2',
        success: '#2E8B66', successSurface: '#DCF0E7', warning: '#C98A1F', warningSurface: '#F7EAD0',
        danger: '#CF4A4A', dangerSurface: '#FAE0DF', info: '#3E7FA6', infoSurface: '#DCEAF1',
      },
      dark: {
        bgBase: '#231B19', bgSubtle: '#2B211E', bgMuted: '#382B27',
        surfaceDefault: '#2C211E', surfaceRaised: '#372A26', surfaceSunken: '#1F1714',
        textPrimary: '#F3E7E1', textSecondary: '#CBB4AB', textMuted: '#9A8379', textInverse: '#231B19',
        borderDefault: '#4A3A33', borderStrong: '#634E45', borderSubtle: '#392C27',
        accentDefault: '#F58062', accentHover: '#FF9779', accentSubtle: '#3D2620', accentContrast: '#251713',
        success: '#5BC397', successSurface: '#16291F', warning: '#DEAC54', warningSurface: '#322811',
        danger: '#E78180', dangerSurface: '#3A2120', info: '#6BA6CC', infoSurface: '#172933',
      },
    },
    typography: {
      fontDisplay: "'Quicksand', 'Pretendard', 'Noto Sans KR', sans-serif",
      fontBody: "'Nunito Sans', 'Pretendard', 'Noto Sans KR', sans-serif",
      fontMono: "'Roboto Mono', 'SFMono-Regular', monospace",
      baseSize: 15, scale: 1.24, displayWeight: 800, bodyWeight: 480,
      headingTracking: -0.004, bodyLineHeight: 1.6,
    },
    shape: { radius: 14, radiusLarge: 22, borderWidth: 1, shadow: 'medium' },
    spacing: { density: 'comfortable', unit: 6 },
    layout: { navigation: 'top-bar-with-subnav', contentWidth: 'adaptive', listStyle: 'cards' },
    motion: { level: 'moderate', durationMs: 240 },
  },
  'technical-industrial': {
    name: 'Technical Industrial',
    keywords: ['기술적', '고대비', '모노 수치', '엔지니어링'],
    recommendReason: '정밀함·신뢰·기술적 통제감을 주고 싶을 때. 수치는 모노폰트, 고대비 경계.',
    description: '차가운 슬레이트 배경에 선명한 앰버 강조, 모노 수치. 또렷한 경계와 고대비로 계기판 같은 통제감.',
    color: {
      light: {
        bgBase: '#EEF1F4', bgSubtle: '#E5E9EE', bgMuted: '#D7DDE5',
        surfaceDefault: '#F9FBFC', surfaceRaised: '#FDFEFE', surfaceSunken: '#E8ECF1',
        textPrimary: '#161B22', textSecondary: '#3F4A57', textMuted: '#6E7986', textInverse: '#F6F9FB',
        borderDefault: '#C7D0DA', borderStrong: '#9FAAB8', borderSubtle: '#DCE2EA',
        accentDefault: '#B26A06', accentHover: '#925706', accentSubtle: '#F4E6CC', accentContrast: '#FCF6EC',
        success: '#1C7350', successSurface: '#D7ECE2', warning: '#9C6B12', warningSurface: '#F1E6CB',
        danger: '#B3362F', dangerSurface: '#F1DAD8', info: '#1E5E80', infoSurface: '#D5E5ED',
      },
      dark: {
        bgBase: '#0F141B', bgSubtle: '#151C25', bgMuted: '#1F2A36',
        surfaceDefault: '#161E27', surfaceRaised: '#1E2832', surfaceSunken: '#0C1117',
        textPrimary: '#E3EAF2', textSecondary: '#A2AEBD', textMuted: '#697686', textInverse: '#0F141B',
        borderDefault: '#2A3744', borderStrong: '#3E4E5E', borderSubtle: '#202A35',
        accentDefault: '#E0962A', accentHover: '#F2A93D', accentSubtle: '#33260F', accentContrast: '#19120A',
        success: '#3EBE85', successSurface: '#13291F', warning: '#D8A33F', warningSurface: '#302711',
        danger: '#E07069', dangerSurface: '#341B1A', info: '#4F9FC4', infoSurface: '#142A35',
      },
    },
    typography: {
      fontDisplay: "'Söhne', 'Inter', 'Pretendard', 'Noto Sans KR', sans-serif",
      fontBody: "'Inter', 'Pretendard', 'Noto Sans KR', sans-serif",
      fontMono: "'JetBrains Mono', 'SFMono-Regular', monospace",
      baseSize: 14, scale: 1.2, displayWeight: 760, bodyWeight: 440,
      headingTracking: -0.008, bodyLineHeight: 1.5,
    },
    shape: { radius: 2, radiusLarge: 4, borderWidth: 1, shadow: 'none' },
    spacing: { density: 'compact', unit: 4 },
    layout: { navigation: 'persistent-left-sidebar', contentWidth: 'fluid', listStyle: 'table' },
    motion: { level: 'minimal', durationMs: 140 },
  },
};
const ARCHETYPE_ORDER = ['warm-editorial', 'compact-productivity', 'minimal-monochrome', 'friendly-consumer', 'technical-industrial'];

// 키워드 → 아키타입 매핑(휴리스틱). 가장 많이 맞는 아키타입을 고르되, 이미 쓴 건 다음 후보에 양보해
// 후보들이 서로 구별되게 한다(중복 회피).
const KEYWORD_HINTS: Record<string, string[]> = {
  'warm-editorial': ['editorial', 'warm', 'serif', 'reading', 'magazine', 'calm', 'restrained', '따뜻', '읽기', '에디토리얼', '차분'],
  'compact-productivity': ['compact', 'dense', 'productivity', 'table', 'dashboard', 'saas', 'keyboard', 'admin', '조밀', '업무', '생산성', '테이블'],
  'minimal-monochrome': ['minimal', 'monochrome', 'mono', 'neutral', 'grayscale', 'restrained', 'clean', '미니멀', '무채색', '절제'],
  'friendly-consumer': ['friendly', 'consumer', 'rounded', 'playful', 'soft', 'warm', 'approachable', 'mobile', '친근', '둥근', '소비자'],
  'technical-industrial': ['technical', 'industrial', 'dark', 'data', 'engineering', 'precision', 'metrics', '기술', '다크', '데이터', '계측'],
};

function pickArchetype(cand: RefCandidate, used: Set<string>): string {
  const hay = [...cand.keywords, ...cand.apply, cand.expectedImpression, cand.name, cand.category]
    .join(' ').toLowerCase();
  const score: Record<string, number> = {};
  for (const arch of ARCHETYPE_ORDER) {
    score[arch] = KEYWORD_HINTS[arch].reduce((n, kw) => n + (hay.includes(kw.toLowerCase()) ? 1 : 0), 0);
    if (used.has(arch)) score[arch] -= 0.5; // 이미 쓴 아키타입은 약하게 페널티(구별성 유지)
  }
  // 최고점 선택, 동점이면 아직 안 쓴 순서대로
  let best = ARCHETYPE_ORDER[0];
  let bestScore = -Infinity;
  for (const arch of ARCHETYPE_ORDER) {
    if (score[arch] > bestScore) { bestScore = score[arch]; best = arch; }
  }
  // 점수가 모두 0 이하(키워드 매칭 없음)면 아직 안 쓴 아키타입을 순서대로 배정
  if (bestScore <= 0) {
    const free = ARCHETYPE_ORDER.find((a) => !used.has(a));
    if (free) best = free;
  }
  return best;
}

// --------------------------------------------------------------------------
// candidates.json 구성 — CandidatesFile = { project, generatedAt, candidates: Candidate[] }
//   각 Candidate 는 compare-ui/src/types.ts 의 Candidate 와 정확히 일치한다(토큰/메타만, 콘텐츠 금지).
//   references.json 의 단순 후보 메타(keywords/recommendedFor/risks/source)는 그대로 옮기고,
//   토큰(color light+dark / typography / shape / spacing / layout / motion)은 아키타입 시드로 합성한다.
// --------------------------------------------------------------------------

/** src/types.ts 의 Candidate 미러 — 구조 잠금용(런타임에서 App.tsx 가 그대로 읽는다). */
interface BuiltCandidate {
  id: string;
  name: string;
  keywords: string[];
  recommendReason: string;
  description: string;
  recommendedFor: string[];
  risks: string[];
  color: { light: ColorScheme; dark: ColorScheme };
  typography: TypographyTokens;
  shape: ShapeTokens;
  spacing: SpacingTokens;
  layout: LayoutTokens;
  motion: MotionTokens;
}

interface BuiltCandidatesFile {
  project: string;
  generatedAt: string;
  candidates: BuiltCandidate[];
}

function buildCandidates(refs: References): BuiltCandidatesFile {
  const used = new Set<string>();
  const candidates: BuiltCandidate[] = [];
  for (const c of refs.candidates) {
    const archKey = pickArchetype(c, used);
    used.add(archKey);
    const seed = ARCHETYPES[archKey];
    candidates.push({
      id: c.id,
      // 후보 이름은 references 우선, 비면 아키타입 이름.
      name: c.name || seed.name,
      // 한 줄 인상 키워드 — references 후보 keywords 우선(콘텐츠 아님, 후보 메타).
      keywords: (c.keywords && c.keywords.length ? c.keywords : seed.keywords).slice(0, 6),
      // 추천 이유 한 문장 — references 의 expectedImpression 우선, 비면 시드 문장.
      recommendReason: c.expectedImpression || seed.recommendReason,
      description: seed.description,
      // 비교 앱 설명/선택 패널용 — references.json 에서 가져온 *설명*(토큰 아님, 콘텐츠도 아님).
      recommendedFor: c.recommendedFor ?? [],
      risks: c.risks ?? [],
      // 토큰 — light/dark 두 모드 모두, src/types.ts 의 ColorScheme 전 필드를 채운다.
      color: { light: { ...seed.color.light }, dark: { ...seed.color.dark } },
      typography: { ...seed.typography },
      shape: { ...seed.shape },
      spacing: { ...seed.spacing },
      layout: { ...seed.layout },
      motion: { ...seed.motion },
    });
  }
  return {
    project: refs.project,
    generatedAt: refs.generatedAt || new Date(0).toISOString(),
    candidates,
  };
}

// --------------------------------------------------------------------------
// content.json — Content = { app, dashboard, list, detail, form }
//   compare-ui/src/types.ts 의 Content + public/data/content.json(정답 샘플)과 정확히 일치한다.
//   동일 조건 비교 불변식(CONTRACT §13): 이 콘텐츠는 *모든 후보가 공유*하며 후보별로 갈라지지 않는다.
//   제품 유형별 차이는 이 *고정 구조* 위에서 데이터 값만 바꾼다(키/형태는 절대 변형 금지).
//   가짜 수치(99%/10x) 금지 — 그럴듯한 도메인 샘플 데이터.
// --------------------------------------------------------------------------

/** Content 미러 타입 — src/types.ts 와 동일 키. 산출 형태를 컴파일 타임에 고정. */
interface MetricCard { label: string; value: string; delta?: string; trend?: 'up' | 'down' | 'flat'; }
interface ActivityItem { time: string; text: string; }
interface ListRow { id: string; name: string; category: string; amount: string; date: string; status: 'active' | 'pending' | 'overdue' | 'archived'; }
interface DetailField { label: string; value: string; }
interface FormFieldDef { name: string; label: string; type: 'text' | 'email' | 'select' | 'textarea' | 'number' | 'date'; placeholder?: string; options?: string[]; hint?: string; required?: boolean; }
interface BuiltContent {
  app: { productName: string; nav: { key: string; label: string }[]; userName: string; searchPlaceholder: string };
  dashboard: { title: string; subtitle: string; metrics: MetricCard[]; activityTitle: string; activity: ActivityItem[] };
  list: { title: string; subtitle: string; columns: string[]; rows: ListRow[]; filters: string[]; searchPlaceholder: string };
  detail: {
    title: string; statusLabel: string; status: ListRow['status'];
    fields: DetailField[]; bodyTitle: string; body: string;
    timelineTitle: string; timeline: { time: string; text: string; amount: string }[];
    primaryAction: string; secondaryAction: string;
  };
  form: { title: string; subtitle: string; sections: { heading: string; fields: FormFieldDef[] }[]; submitLabel: string; cancelLabel: string };
}

/** 제품 유형별 도메인 어휘 — 고정 Content 구조에 끼워 넣을 라벨/샘플 데이터 묶음. */
interface ProductPreset {
  /** 주체 명칭(예: 고객/상품/문서). nav·타이틀에 쓰인다. */
  subject: string;
  app: BuiltContent['app'];
  dashboard: BuiltContent['dashboard'];
  list: BuiltContent['list'];
  detail: BuiltContent['detail'];
  form: BuiltContent['form'];
}

function detectProductType(refs: References, explicit: string): string {
  if (explicit) return explicit;
  const hay = refs.candidates.map((c) => [...c.keywords, ...c.recommendedFor, c.category].join(' ')).join(' ').toLowerCase();
  if (/commerce|shop|cart|product|커머스|상품|장바구니/.test(hay)) return 'commerce';
  if (/content|media|article|read|콘텐츠|미디어|읽기|기사/.test(hay)) return 'content';
  if (/admin|dashboard|table|filter|관리자|대시보드|테이블/.test(hay)) return 'admin';
  if (/mobile|app|모바일/.test(hay)) return 'mobile';
  return 'crm';
}

/** 제품 유형별 프리셋. 키/형태는 모두 동일(Content), 데이터 값만 다르다. */
const PRODUCT_PRESETS: Record<string, ProductPreset> = {
  crm: {
    subject: '고객',
    app: {
      productName: '결자장부',
      nav: [
        { key: 'dashboard', label: '대시보드' }, { key: 'list', label: '고객' },
        { key: 'detail', label: '거래 상세' }, { key: 'form', label: '고객 등록' },
        { key: 'settings', label: '설정' },
      ],
      userName: '박정후',
      searchPlaceholder: '고객·거래 검색',
    },
    dashboard: {
      title: '이번 달 요약',
      subtitle: '2026년 6월 · 결제·미수금·신규 고객 현황',
      metrics: [
        { label: '이번 달 매출', value: '₩12,480,000', delta: '지난달 대비 +8건 결제', trend: 'up' },
        { label: '미수금', value: '₩2,140,000', delta: '연체 3건 포함', trend: 'down' },
        { label: '신규 고객', value: '7명', delta: '이번 주 2명', trend: 'up' },
        { label: '처리 대기', value: '5건', delta: '견적 3 · 청구 2', trend: 'flat' },
      ],
      activityTitle: '최근 활동',
      activity: [
        { time: '오늘 14:20', text: '한빛공방 6월 정기 청구서 발송' },
        { time: '오늘 11:05', text: '이로움디자인 입금 확인 ₩880,000' },
        { time: '어제 17:42', text: '신규 고객 ‘봄날상회’ 등록' },
        { time: '어제 09:30', text: '정음스튜디오 견적서 v2 수정' },
        { time: '6월 17일', text: '달소금베이커리 연체 안내 메일 발송' },
      ],
    },
    list: {
      title: '고객',
      subtitle: '거래 중인 고객 24명',
      columns: ['고객명', '분류', '누적 거래액', '최근 거래', '상태'],
      searchPlaceholder: '고객명·사업자번호 검색',
      filters: ['전체', '진행중', '대기', '연체', '보관'],
      rows: [
        { id: 'c-1041', name: '한빛공방', category: '정기 거래', amount: '₩4,820,000', date: '2026-06-18', status: 'active' },
        { id: 'c-1037', name: '이로움디자인', category: '프로젝트', amount: '₩3,150,000', date: '2026-06-18', status: 'active' },
        { id: 'c-1033', name: '달소금베이커리', category: '정기 거래', amount: '₩1,260,000', date: '2026-06-10', status: 'overdue' },
        { id: 'c-1029', name: '정음스튜디오', category: '프로젝트', amount: '₩2,540,000', date: '2026-06-16', status: 'pending' },
        { id: 'c-1024', name: '봄날상회', category: '신규', amount: '₩320,000', date: '2026-06-17', status: 'active' },
        { id: 'c-1018', name: '마루공업', category: '정기 거래', amount: '₩7,910,000', date: '2026-05-29', status: 'archived' },
        { id: 'c-1015', name: '조은물산', category: '프로젝트', amount: '₩980,000', date: '2026-06-09', status: 'pending' },
        { id: 'c-1009', name: '다온헬스케어', category: '정기 거래', amount: '₩5,470,000', date: '2026-06-14', status: 'active' },
      ],
    },
    detail: {
      title: '한빛공방',
      statusLabel: '진행중',
      status: 'active',
      fields: [
        { label: '분류', value: '정기 거래' },
        { label: '담당자', value: '윤소민 실장' },
        { label: '연락처', value: '010-2480-1041' },
        { label: '사업자번호', value: '214-81-04190' },
        { label: '누적 거래액', value: '₩4,820,000' },
        { label: '결제 조건', value: '월말 정산 · 계좌이체' },
      ],
      bodyTitle: '메모',
      body: '매월 셋째 주에 정기 청구. 견적은 부가세 별도로 안내하며, 변경 시 윤소민 실장에게 사전 공유. 작년 12월부터 거래 시작했고 입금이 안정적인 편.',
      timelineTitle: '거래 내역',
      timeline: [
        { time: '2026-06-18', text: '6월 정기 청구서 발송', amount: '₩880,000' },
        { time: '2026-05-30', text: '5월 정산 입금 확인', amount: '₩880,000' },
        { time: '2026-05-02', text: '추가 작업 견적 승인', amount: '₩1,200,000' },
        { time: '2026-04-28', text: '4월 정산 입금 확인', amount: '₩880,000' },
      ],
      primaryAction: '청구서 발송',
      secondaryAction: '거래 내역 내보내기',
    },
    form: {
      title: '고객 등록',
      subtitle: '거래를 시작할 고객 정보를 입력하세요. 사업자번호는 나중에 채워도 됩니다.',
      submitLabel: '고객 등록',
      cancelLabel: '취소',
      sections: [
        {
          heading: '기본 정보',
          fields: [
            { name: 'name', label: '고객명', type: 'text', placeholder: '예: 한빛공방', required: true },
            { name: 'contactPerson', label: '담당자', type: 'text', placeholder: '예: 윤소민 실장' },
            { name: 'email', label: '이메일', type: 'email', placeholder: 'billing@example.com', hint: '청구서가 이 주소로 발송됩니다.' },
            { name: 'phone', label: '연락처', type: 'text', placeholder: '010-0000-0000' },
          ],
        },
        {
          heading: '거래 조건',
          fields: [
            { name: 'category', label: '분류', type: 'select', options: ['정기 거래', '프로젝트', '신규', '일회성'], required: true },
            { name: 'terms', label: '결제 조건', type: 'select', options: ['월말 정산', '건별 선결제', '납품 후 15일', '협의'] },
            { name: 'bizNumber', label: '사업자번호', type: 'text', placeholder: '000-00-00000', hint: '선택 입력 — 세금계산서 발행 시 필요합니다.' },
            { name: 'startDate', label: '거래 시작일', type: 'date' },
          ],
        },
        {
          heading: '메모',
          fields: [
            { name: 'memo', label: '내부 메모', type: 'textarea', placeholder: '청구 주기, 주의사항 등 거래에 도움이 되는 메모', hint: '고객에게는 보이지 않습니다.' },
          ],
        },
      ],
    },
  },
  admin: {
    subject: '문서',
    app: {
      productName: '운영 콘솔',
      nav: [
        { key: 'dashboard', label: '대시보드' }, { key: 'list', label: '요청 목록' },
        { key: 'detail', label: '요청 상세' }, { key: 'form', label: '항목 등록' },
        { key: 'settings', label: '설정' },
      ],
      userName: '관리자 김선우',
      searchPlaceholder: '요청·담당자 검색',
    },
    dashboard: {
      title: '운영 현황',
      subtitle: '2026년 6월 · 처리·대기·반려 요청 추이',
      metrics: [
        { label: '오늘 처리', value: '184건', delta: '어제 대비 +23건', trend: 'up' },
        { label: '대기 큐', value: '37건', delta: 'SLA 임박 4건', trend: 'down' },
        { label: '평균 처리시간', value: '6분 12초', delta: '지난주 대비 -41초', trend: 'up' },
        { label: '반려', value: '9건', delta: '재요청 5건', trend: 'flat' },
      ],
      activityTitle: '최근 처리',
      activity: [
        { time: '오늘 15:02', text: '요청 #4821 승인 — 윤하늘' },
        { time: '오늘 14:36', text: '요청 #4818 반려 — 입력 누락' },
        { time: '오늘 13:50', text: '요청 #4815 처리 완료' },
        { time: '어제 18:11', text: '배치 정산 24건 일괄 승인' },
        { time: '어제 10:24', text: '권한 변경 요청 #4790 검토 대기' },
      ],
    },
    list: {
      title: '요청 목록',
      subtitle: '처리 대기·진행 중 요청 37건',
      columns: ['요청 ID', '유형', '담당자', '접수일', '상태'],
      searchPlaceholder: '요청 ID·담당자 검색',
      filters: ['전체', '진행중', '대기', '반려', '보관'],
      rows: [
        { id: 'r-4821', name: '#4821 권한 부여', category: '권한', amount: '윤하늘', date: '2026-06-18', status: 'active' },
        { id: 'r-4818', name: '#4818 환불 승인', category: '정산', amount: '서지오', date: '2026-06-18', status: 'overdue' },
        { id: 'r-4815', name: '#4815 데이터 정정', category: '데이터', amount: '한도윤', date: '2026-06-17', status: 'active' },
        { id: 'r-4810', name: '#4810 계정 병합', category: '계정', amount: '문가람', date: '2026-06-16', status: 'pending' },
        { id: 'r-4802', name: '#4802 정산 보류', category: '정산', amount: '이로운', date: '2026-06-15', status: 'pending' },
        { id: 'r-4790', name: '#4790 권한 변경', category: '권한', amount: '윤하늘', date: '2026-06-12', status: 'archived' },
        { id: 'r-4785', name: '#4785 배치 재실행', category: '데이터', amount: '한도윤', date: '2026-06-11', status: 'active' },
        { id: 'r-4779', name: '#4779 계정 잠금 해제', category: '계정', amount: '서지오', date: '2026-06-09', status: 'pending' },
      ],
    },
    detail: {
      title: '요청 #4821 — 권한 부여',
      statusLabel: '진행중',
      status: 'active',
      fields: [
        { label: '유형', value: '권한' },
        { label: '담당자', value: '윤하늘' },
        { label: '요청자', value: '제품팀 / 정수아' },
        { label: '대상 리소스', value: '결제 관리 콘솔' },
        { label: '접수일', value: '2026-06-18' },
        { label: '우선순위', value: '높음 · SLA 4시간' },
      ],
      bodyTitle: '처리 메모',
      body: '결제 관리 콘솔 읽기/쓰기 권한 부여 요청. 보안팀 사전 승인 확인됨(승인번호 SEC-2261). 부여 후 7일간 활동 로그 모니터링 필요. 만료 정책은 분기 단위 재검토.',
      timelineTitle: '처리 이력',
      timeline: [
        { time: '2026-06-18 15:02', text: '승인 — 윤하늘', amount: '단계 3/3' },
        { time: '2026-06-18 11:40', text: '보안팀 검토 완료', amount: '단계 2/3' },
        { time: '2026-06-18 09:12', text: '접수 — 자동 분류', amount: '단계 1/3' },
      ],
      primaryAction: '승인 처리',
      secondaryAction: '반려',
    },
    form: {
      title: '항목 등록',
      subtitle: '새 처리 항목을 등록하세요. 우선순위에 따라 SLA가 자동 산정됩니다.',
      submitLabel: '항목 등록',
      cancelLabel: '취소',
      sections: [
        {
          heading: '기본 정보',
          fields: [
            { name: 'title', label: '제목', type: 'text', placeholder: '예: 권한 부여 요청', required: true },
            { name: 'owner', label: '담당자', type: 'text', placeholder: '예: 윤하늘' },
            { name: 'requester', label: '요청자', type: 'text', placeholder: '예: 제품팀 / 정수아' },
            { name: 'notifyEmail', label: '알림 이메일', type: 'email', placeholder: 'ops@example.com', hint: '상태 변경 시 이 주소로 알림됩니다.' },
          ],
        },
        {
          heading: '분류',
          fields: [
            { name: 'category', label: '유형', type: 'select', options: ['권한', '정산', '데이터', '계정'], required: true },
            { name: 'priority', label: '우선순위', type: 'select', options: ['낮음', '보통', '높음', '긴급'] },
            { name: 'dueDate', label: '마감일', type: 'date' },
          ],
        },
        {
          heading: '상세',
          fields: [
            { name: 'memo', label: '처리 메모', type: 'textarea', placeholder: '검토 시 참고할 배경·근거', hint: '요청자에게는 보이지 않습니다.' },
          ],
        },
      ],
    },
  },
};

// content / commerce / mobile 은 crm 구조를 도메인 어휘만 바꿔 파생(키/형태 동일 유지).
PRODUCT_PRESETS.content = {
  subject: '글',
  app: {
    productName: '읽는창고',
    nav: [
      { key: 'dashboard', label: '대시보드' }, { key: 'list', label: '글 목록' },
      { key: 'detail', label: '글 보기' }, { key: 'form', label: '새 글' },
      { key: 'settings', label: '설정' },
    ],
    userName: '편집자 한유진',
    searchPlaceholder: '제목·태그 검색',
  },
  dashboard: {
    title: '발행 현황',
    subtitle: '2026년 6월 · 발행·초안·반응 추이',
    metrics: [
      { label: '이번 달 조회', value: '48,210', delta: '지난달 대비 +6,400', trend: 'up' },
      { label: '발행 대기', value: '12편', delta: '검수 중 4편', trend: 'flat' },
      { label: '신규 구독', value: '318명', delta: '이번 주 92명', trend: 'up' },
      { label: '댓글 신고', value: '3건', delta: '검토 대기', trend: 'down' },
    ],
    activityTitle: '최근 활동',
    activity: [
      { time: '오늘 13:10', text: '‘느리게 쓰는 법’ 발행' },
      { time: '오늘 10:42', text: '‘여름 기록’ 초안 저장' },
      { time: '어제 19:05', text: '구독자 1,000명 돌파' },
      { time: '어제 14:20', text: '‘오래된 노트’ 수정 발행' },
      { time: '6월 17일', text: '댓글 신고 2건 처리' },
    ],
  },
  list: {
    title: '글 목록',
    subtitle: '발행·초안 글 56편',
    columns: ['제목', '분류', '조회수', '수정일', '상태'],
    searchPlaceholder: '제목·태그 검색',
    filters: ['전체', '발행', '초안', '예약', '보관'],
    rows: [
      { id: 'p-221', name: '느리게 쓰는 법', category: '에세이', amount: '4,820 조회', date: '2026-06-18', status: 'active' },
      { id: 'p-219', name: '여름 기록', category: '일기', amount: '0 조회', date: '2026-06-18', status: 'pending' },
      { id: 'p-214', name: '오래된 노트', category: '에세이', amount: '12,640 조회', date: '2026-06-16', status: 'active' },
      { id: 'p-208', name: '도시의 소리', category: '리뷰', amount: '2,540 조회', date: '2026-06-14', status: 'pending' },
      { id: 'p-201', name: '책상 정리의 기술', category: '실용', amount: '8,910 조회', date: '2026-06-10', status: 'active' },
      { id: 'p-195', name: '지난 봄에게', category: '에세이', amount: '5,470 조회', date: '2026-05-29', status: 'archived' },
      { id: 'p-188', name: '느린 아침', category: '일기', amount: '980 조회', date: '2026-06-09', status: 'overdue' },
      { id: 'p-180', name: '오후 네 시의 빛', category: '에세이', amount: '3,150 조회', date: '2026-06-13', status: 'active' },
    ],
  },
  detail: {
    title: '느리게 쓰는 법',
    statusLabel: '발행됨',
    status: 'active',
    fields: [
      { label: '분류', value: '에세이' },
      { label: '저자', value: '한유진' },
      { label: '발행일', value: '2026-06-18' },
      { label: '읽는 시간', value: '약 6분' },
      { label: '조회수', value: '4,820' },
      { label: '태그', value: '글쓰기 · 습관 · 기록' },
    ],
    bodyTitle: '본문 발췌',
    body: '빠르게 쓰려고 할수록 문장은 자꾸 미끄러진다. 한 문장을 끝까지 책임지는 마음으로 천천히 적으면, 오히려 글은 제 속도를 찾는다. 이 글은 매일 한 단락씩 쌓아 올린 기록이다.',
    timelineTitle: '수정 이력',
    timeline: [
      { time: '2026-06-18', text: '발행', amount: 'v3' },
      { time: '2026-06-17', text: '교정 반영', amount: 'v2' },
      { time: '2026-06-15', text: '초안 작성', amount: 'v1' },
    ],
    primaryAction: '수정',
    secondaryAction: '미리보기',
  },
  form: {
    title: '새 글',
    subtitle: '발행 전에 분류와 태그를 정해두면 나중에 찾기 쉽습니다.',
    submitLabel: '발행',
    cancelLabel: '임시저장',
    sections: [
      {
        heading: '기본 정보',
        fields: [
          { name: 'title', label: '제목', type: 'text', placeholder: '예: 느리게 쓰는 법', required: true },
          { name: 'subtitle', label: '부제', type: 'text', placeholder: '예: 매일 한 단락의 기록' },
          { name: 'author', label: '저자', type: 'text', placeholder: '예: 한유진' },
        ],
      },
      {
        heading: '분류',
        fields: [
          { name: 'category', label: '분류', type: 'select', options: ['에세이', '일기', '리뷰', '실용'], required: true },
          { name: 'tags', label: '태그', type: 'text', placeholder: '쉼표로 구분', hint: '검색·추천에 사용됩니다.' },
          { name: 'publishDate', label: '발행일', type: 'date' },
        ],
      },
      {
        heading: '본문',
        fields: [
          { name: 'body', label: '본문', type: 'textarea', placeholder: '여기에 글을 작성하세요', required: true },
        ],
      },
    ],
  },
};
PRODUCT_PRESETS.commerce = {
  subject: '상품',
  app: {
    productName: '오늘상점',
    nav: [
      { key: 'dashboard', label: '대시보드' }, { key: 'list', label: '상품' },
      { key: 'detail', label: '상품 상세' }, { key: 'form', label: '상품 등록' },
      { key: 'settings', label: '설정' },
    ],
    userName: '점주 오세린',
    searchPlaceholder: '상품·주문 검색',
  },
  dashboard: {
    title: '매장 요약',
    subtitle: '2026년 6월 · 매출·주문·재고 현황',
    metrics: [
      { label: '오늘 매출', value: '₩1,284,000', delta: '주문 42건', trend: 'up' },
      { label: '배송 대기', value: '18건', delta: '오늘 출고 12건', trend: 'flat' },
      { label: '품절 임박', value: '6개', delta: '재입고 필요', trend: 'down' },
      { label: '신규 리뷰', value: '23개', delta: '평균 4.6점', trend: 'up' },
    ],
    activityTitle: '최근 주문',
    activity: [
      { time: '오늘 16:21', text: '주문 #20617 결제 완료 ₩38,000' },
      { time: '오늘 15:48', text: '‘리넨 앞치마’ 재고 5개 남음' },
      { time: '오늘 14:02', text: '주문 #20611 출고 처리' },
      { time: '어제 20:33', text: '신규 리뷰 4건 등록' },
      { time: '어제 11:10', text: '‘무쇠 팬 24cm’ 품절' },
    ],
  },
  list: {
    title: '상품',
    subtitle: '판매 중인 상품 86개',
    columns: ['상품명', '분류', '가격', '재고', '상태'],
    searchPlaceholder: '상품명·SKU 검색',
    filters: ['전체', '판매중', '품절 임박', '숨김', '보관'],
    rows: [
      { id: 's-3041', name: '리넨 앞치마', category: '주방', amount: '₩38,000', date: '재고 5', status: 'overdue' },
      { id: 's-3037', name: '무쇠 팬 24cm', category: '주방', amount: '₩62,000', date: '재고 0', status: 'archived' },
      { id: 's-3033', name: '원목 도마', category: '주방', amount: '₩24,000', date: '재고 31', status: 'active' },
      { id: 's-3029', name: '면 행주 5매', category: '생활', amount: '₩9,800', date: '재고 120', status: 'active' },
      { id: 's-3024', name: '핸드드립 세트', category: '커피', amount: '₩54,000', date: '재고 14', status: 'active' },
      { id: 's-3018', name: '유리 보관용기', category: '생활', amount: '₩18,500', date: '재고 8', status: 'pending' },
      { id: 's-3015', name: '대나무 수저통', category: '주방', amount: '₩12,000', date: '재고 47', status: 'active' },
      { id: 's-3009', name: '왁스 코튼 장바구니', category: '생활', amount: '₩29,000', date: '재고 3', status: 'overdue' },
    ],
  },
  detail: {
    title: '리넨 앞치마',
    statusLabel: '재고 임박',
    status: 'overdue',
    fields: [
      { label: '분류', value: '주방' },
      { label: 'SKU', value: 'APR-LIN-NAT' },
      { label: '가격', value: '₩38,000' },
      { label: '재고', value: '5개' },
      { label: '입고처', value: '한울리넨' },
      { label: '평점', value: '4.7 · 리뷰 64' },
    ],
    bodyTitle: '상품 설명',
    body: '워싱 처리한 100% 리넨 앞치마. 사용할수록 부드러워지며 자연스러운 구김이 매력. 길이 조절 가능한 목끈, 깊은 앞주머니 2칸. 찬물 단독 세탁 권장.',
    timelineTitle: '재고 이력',
    timeline: [
      { time: '2026-06-18', text: '주문 출고 -3', amount: '재고 5' },
      { time: '2026-06-12', text: '입고 +20', amount: '재고 8' },
      { time: '2026-06-02', text: '주문 출고 -12', amount: '재고 -12' },
    ],
    primaryAction: '재고 추가',
    secondaryAction: '판매 숨김',
  },
  form: {
    title: '상품 등록',
    subtitle: '새 상품을 등록하세요. 재고와 가격은 등록 후에도 수정할 수 있습니다.',
    submitLabel: '상품 등록',
    cancelLabel: '취소',
    sections: [
      {
        heading: '기본 정보',
        fields: [
          { name: 'name', label: '상품명', type: 'text', placeholder: '예: 리넨 앞치마', required: true },
          { name: 'sku', label: 'SKU', type: 'text', placeholder: '예: APR-LIN-NAT' },
          { name: 'price', label: '가격', type: 'number', placeholder: '38000', required: true },
        ],
      },
      {
        heading: '재고·분류',
        fields: [
          { name: 'category', label: '분류', type: 'select', options: ['주방', '생활', '커피', '문구'], required: true },
          { name: 'stock', label: '재고 수량', type: 'number', placeholder: '0' },
          { name: 'supplier', label: '입고처', type: 'text', placeholder: '예: 한울리넨', hint: '재입고 시 참고됩니다.' },
        ],
      },
      {
        heading: '설명',
        fields: [
          { name: 'description', label: '상품 설명', type: 'textarea', placeholder: '소재, 사용법, 세탁 방법 등' },
        ],
      },
    ],
  },
};
PRODUCT_PRESETS.mobile = {
  subject: '항목',
  app: {
    productName: '하루기록',
    nav: [
      { key: 'dashboard', label: '홈' }, { key: 'list', label: '기록' },
      { key: 'detail', label: '상세' }, { key: 'form', label: '추가' },
      { key: 'settings', label: '설정' },
    ],
    userName: '서다온',
    searchPlaceholder: '기록 검색',
  },
  dashboard: {
    title: '오늘',
    subtitle: '2026년 6월 18일 · 습관·기분·메모',
    metrics: [
      { label: '연속 기록', value: '23일', delta: '최고 31일', trend: 'up' },
      { label: '오늘 완료', value: '4 / 6', delta: '남은 2개', trend: 'flat' },
      { label: '이번 주 평균 기분', value: '좋음', delta: '지난주보다 ↑', trend: 'up' },
      { label: '메모', value: '12개', delta: '이번 주 5개', trend: 'flat' },
    ],
    activityTitle: '오늘 한 일',
    activity: [
      { time: '08:10', text: '아침 산책 30분 완료' },
      { time: '09:30', text: '물 1L 마시기 체크' },
      { time: '13:00', text: '점심 후 스트레칭' },
      { time: '21:15', text: '오늘의 기분 기록 — 좋음' },
      { time: '22:40', text: '내일 할 일 3개 메모' },
    ],
  },
  list: {
    title: '기록',
    subtitle: '이번 달 기록 41개',
    columns: ['항목', '분류', '값', '날짜', '상태'],
    searchPlaceholder: '기록 검색',
    filters: ['전체', '완료', '진행중', '건너뜀', '보관'],
    rows: [
      { id: 'm-541', name: '아침 산책', category: '운동', amount: '30분', date: '2026-06-18', status: 'active' },
      { id: 'm-538', name: '물 마시기', category: '건강', amount: '1.2L', date: '2026-06-18', status: 'active' },
      { id: 'm-534', name: '독서', category: '습관', amount: '20쪽', date: '2026-06-17', status: 'pending' },
      { id: 'm-529', name: '스트레칭', category: '운동', amount: '10분', date: '2026-06-17', status: 'active' },
      { id: 'm-523', name: '명상', category: '마음', amount: '건너뜀', date: '2026-06-16', status: 'overdue' },
      { id: 'm-517', name: '일기 쓰기', category: '습관', amount: '1편', date: '2026-06-15', status: 'active' },
      { id: 'm-510', name: '커피 줄이기', category: '건강', amount: '1잔', date: '2026-06-14', status: 'pending' },
      { id: 'm-502', name: '가계부', category: '습관', amount: '정리됨', date: '2026-06-13', status: 'archived' },
    ],
  },
  detail: {
    title: '아침 산책',
    statusLabel: '완료',
    status: 'active',
    fields: [
      { label: '분류', value: '운동' },
      { label: '오늘 값', value: '30분' },
      { label: '목표', value: '주 5회' },
      { label: '이번 주', value: '4 / 5' },
      { label: '연속', value: '23일' },
      { label: '시작일', value: '2026-05-01' },
    ],
    bodyTitle: '메모',
    body: '아침에 햇빛을 보며 걷는 30분이 하루 컨디션을 가장 크게 바꿔준다. 비 오는 날은 실내 스트레칭으로 대체. 무리하지 않는 선에서 매일 이어가는 게 목표.',
    timelineTitle: '최근 기록',
    timeline: [
      { time: '2026-06-18', text: '완료', amount: '30분' },
      { time: '2026-06-17', text: '완료', amount: '28분' },
      { time: '2026-06-16', text: '건너뜀', amount: '—' },
    ],
    primaryAction: '오늘 완료',
    secondaryAction: '건너뛰기',
  },
  form: {
    title: '기록 추가',
    subtitle: '새 습관이나 메모를 추가하세요. 목표는 나중에 바꿔도 됩니다.',
    submitLabel: '추가',
    cancelLabel: '취소',
    sections: [
      {
        heading: '기본 정보',
        fields: [
          { name: 'name', label: '항목', type: 'text', placeholder: '예: 아침 산책', required: true },
          { name: 'goal', label: '목표', type: 'text', placeholder: '예: 주 5회' },
        ],
      },
      {
        heading: '분류',
        fields: [
          { name: 'category', label: '분류', type: 'select', options: ['운동', '건강', '습관', '마음'], required: true },
          { name: 'startDate', label: '시작일', type: 'date' },
        ],
      },
      {
        heading: '메모',
        fields: [
          { name: 'memo', label: '메모', type: 'textarea', placeholder: '동기, 규칙, 예외 상황 등' },
        ],
      },
    ],
  },
};

function buildContent(refs: References, productType: string): BuiltContent {
  // 알 수 없는 유형은 crm 으로 폴백. admin/content/commerce/mobile/crm 만 프리셋 보유.
  const preset = PRODUCT_PRESETS[productType] ?? PRODUCT_PRESETS.crm;
  // productName 은 프로젝트명이 있으면 그것으로(콘텐츠는 후보 무관 단일 소스 — refs.project 는 후보가 아님).
  const productName = refs.project && refs.project !== 'project' ? refs.project : preset.app.productName;
  // 깊은 복사로 프리셋 원본 보호 + Content 정확 형태 반환.
  return {
    app: { ...preset.app, productName, nav: preset.app.nav.map((n) => ({ ...n })) },
    dashboard: {
      ...preset.dashboard,
      metrics: preset.dashboard.metrics.map((m) => ({ ...m })),
      activity: preset.dashboard.activity.map((a) => ({ ...a })),
    },
    list: {
      ...preset.list,
      columns: [...preset.list.columns],
      filters: [...preset.list.filters],
      rows: preset.list.rows.map((r) => ({ ...r })),
    },
    detail: {
      ...preset.detail,
      fields: preset.detail.fields.map((f) => ({ ...f })),
      timeline: preset.detail.timeline.map((t) => ({ ...t })),
    },
    form: {
      ...preset.form,
      sections: preset.form.sections.map((s) => ({ heading: s.heading, fields: s.fields.map((f) => ({ ...f })) })),
    },
  };
}

// --------------------------------------------------------------------------
// 메인
// --------------------------------------------------------------------------
async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return 0; }

  const refPath = resolve(process.cwd(), args.references);
  if (!existsSync(refPath)) {
    console.error(`[오류] references.json 이 없습니다: ${refPath}`);
    console.error('  /design-research 를 먼저 실행해 design/research/references.json 을 생성하세요.');
    console.error('  (후보를 임의로 지어내지 않습니다 — CONTRACT 원칙 2 "말보다 선택을 신뢰".)');
    return 1;
  }

  let refs: References;
  try {
    refs = JSON.parse(await readFile(refPath, 'utf8'));
  } catch (e) {
    console.error(`[오류] JSON 파싱 실패: ${refPath}\n  ${(e as Error).message}`);
    return 1;
  }
  if (!Array.isArray(refs.candidates) || refs.candidates.length < 3) {
    console.error(`[오류] 후보가 3개 미만입니다(${refs.candidates?.length ?? 0}개). 비교 의미가 약합니다.`);
    console.error('  /design-research 로 후보를 더 확보하세요(기본 5, 범위 3~7).');
    return 1;
  }
  if (args.project) refs.project = args.project;
  refs.project ||= 'project';

  const productType = detectProductType(refs, args.productType);
  if (!args.quiet) {
    console.log(`[시드] 프로젝트: ${refs.project}`);
    console.log(`[시드] 후보 ${refs.candidates.length}개 / 제품 유형: ${productType}`);
  }

  // 데이터 구성
  const candidates = buildCandidates(refs);
  const content = buildContent(refs, productType);

  // 후보 구별성 경고 — 같은 아키타입이 2개 이상이면 비교가 약해진다.
  // 아키타입 식별은 후보의 시각 시그니처(폰트+라디우스+밀도+네비) 조합으로 한다.
  const archCount = new Map<string, number>();
  for (const cand of candidates.candidates) {
    const sig = `${cand.typography.fontDisplay}|${cand.shape.radius}|${cand.spacing.density}|${cand.layout.navigation}`;
    archCount.set(sig, (archCount.get(sig) ?? 0) + 1);
  }
  const dup = [...archCount.entries()].filter(([, n]) => n > 1);
  if (dup.length && !args.quiet) {
    console.warn(`[주의] 일부 후보(${dup.reduce((n, [, c]) => n + c, 0)}개)가 같은 시각 아키타입으로 시드됐습니다.`);
    console.warn('  references.json 후보 키워드를 더 구별되게 하면 자동으로 다른 아키타입에 분기됩니다.');
  }

  // 경로
  const compareDir = resolve(process.cwd(), args.outRoot, 'compare');
  const dataDir = join(compareDir, 'data');
  const publicDataDir = join(compareDir, 'public', 'data');

  // 스캐폴드 복사 (먼저 — 그 위에 데이터를 얹는다)
  if (args.scaffold) {
    const scaffoldSrc = join(REPO_ROOT, 'compare-ui');
    if (!existsSync(scaffoldSrc)) {
      console.warn(`[경고] compare-ui 스캐폴드를 찾지 못함: ${scaffoldSrc}. 데이터만 시드합니다.`);
    } else if (existsSync(compareDir) && !args.force) {
      console.warn(`[경고] ${args.outRoot}/compare 가 이미 존재합니다. 스캐폴드 덮어쓰기를 건너뜁니다(데이터만 갱신). 강제하려면 --force.`);
    } else {
      await cp(scaffoldSrc, compareDir, { recursive: true });
      if (!args.quiet) console.log(`[복사] compare-ui 스캐폴드 → ${args.outRoot}/compare/`);
    }
  }

  // 데이터 쓰기.
  //  - data/        = 시드 원본(단일 소스). 사용자가 손댔을 수 있으므로 --force 없으면 보존.
  //  - public/data/ = 앱이 fetch 하는 *파생 사본*. 스캐폴드가 동봉한 샘플을 덮어쓰지 않으면
  //                   비교 앱이 프로젝트 콘텐츠 대신 샘플을 보여주게 된다 → 항상 data/ 기준으로 재생성.
  await mkdir(dataDir, { recursive: true });
  await mkdir(publicDataDir, { recursive: true });

  // 1) 시드 원본(data/) — 기존 사용자 편집 보존(--force 시 덮어씀)
  let canonicalContent: BuiltContent = content;
  let canonicalCandidates: BuiltCandidatesFile = candidates;
  const srcContentPath = join(dataDir, 'content.json');
  const srcCandPath = join(dataDir, 'candidates.json');
  if (existsSync(srcContentPath) && !args.force) {
    console.warn(`[경고] ${args.outRoot}/compare/data/content.json 이 이미 존재합니다(보존). 새 시드로 덮으려면 --force.`);
    try { canonicalContent = JSON.parse(await readFile(srcContentPath, 'utf8')); } catch { /* 파싱 실패 시 새 시드 사용 */ }
  } else {
    await writeFile(srcContentPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  }
  if (existsSync(srcCandPath) && !args.force) {
    console.warn(`[경고] ${args.outRoot}/compare/data/candidates.json 이 이미 존재합니다(보존). 새 시드로 덮으려면 --force.`);
    try { canonicalCandidates = JSON.parse(await readFile(srcCandPath, 'utf8')); } catch { /* 파싱 실패 시 새 시드 사용 */ }
  } else {
    await writeFile(srcCandPath, JSON.stringify(candidates, null, 2) + '\n', 'utf8');
  }

  // 2) 파생 사본(public/data/) — data/ 의 정본을 *항상* 미러링(스캐폴드 샘플 shadow 제거)
  await writeFile(join(publicDataDir, 'content.json'), JSON.stringify(canonicalContent, null, 2) + '\n', 'utf8');
  await writeFile(join(publicDataDir, 'candidates.json'), JSON.stringify(canonicalCandidates, null, 2) + '\n', 'utf8');

  if (!args.quiet) {
    console.log(`[시드] content.json (공통 콘텐츠) → ${args.outRoot}/compare/data/ (정본) + public/data/ (앱 fetch 사본)`);
    console.log(`[시드] candidates.json (후보 토큰) → ${args.outRoot}/compare/data/ (정본) + public/data/ (앱 fetch 사본)`);
  }

  // 불변식 자가검증(CONTRACT §13) — candidates.json 에 *콘텐츠* 문장이 섞이지 않았는지 개략 확인.
  // 후보 토큰 파일에 Content 의 실제 본문 문장(detail.body / 메트릭 라벨 등)이 등장하면 위반.
  const candidatesStr = JSON.stringify(canonicalCandidates);
  const contentSentences = [
    canonicalContent?.detail?.body,
    canonicalContent?.dashboard?.subtitle,
    canonicalContent?.list?.subtitle,
    canonicalContent?.form?.subtitle,
  ].filter((s): s is string => typeof s === 'string' && s.length > 12);
  const leaked = contentSentences.find((s) => candidatesStr.includes(s));
  if (leaked) {
    console.error('[실패] candidates.json 에 콘텐츠 문장이 섞였습니다(불변식 위반). 토큰만 담아야 합니다.');
    console.error(`        누출 문장: "${leaked.slice(0, 40)}…"`);
    return 1;
  }
  // 구조 자가검증 — 산출 형태가 compare-ui 스캐폴드 기대와 일치하는지(핵심 top-level 키).
  if (!Array.isArray(canonicalCandidates?.candidates) || canonicalCandidates.candidates.length === 0) {
    console.error('[실패] candidates.json 의 candidates 가 비어있거나 배열이 아닙니다(스캐폴드 App.tsx 가 candFile.candidates 를 읽습니다).');
    return 1;
  }
  for (const key of ['app', 'dashboard', 'list', 'detail', 'form'] as const) {
    if (!canonicalContent || typeof canonicalContent[key] !== 'object') {
      console.error(`[실패] content.json 에 필수 섹션 '${key}' 가 없습니다(Content = { app, dashboard, list, detail, form }).`);
      return 1;
    }
  }

  if (!args.quiet) {
    console.log('\n[완료] 비교 데이터 시드 완료. 다음:');
    console.log(`  npm --prefix ${args.outRoot}/compare install`);
    console.log(`  npm --prefix ${args.outRoot}/compare run dev   # 후보를 나란히 보고 선택 → selection.json export`);
    console.log('  그 다음 /design-select 로 선택을 합성합니다.');
    console.log('\n[안내] candidates.json 토큰은 references.json 에서 추정한 *시드*입니다. 최종 단일 출처는 design/TOKENS.json.');
  }
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error('[치명] 예기치 못한 오류:', e);
    process.exit(1);
  });
