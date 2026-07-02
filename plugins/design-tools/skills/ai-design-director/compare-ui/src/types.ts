/**
 * compare-ui 타입 정의 — schemas/selection.schema.json · tokens 그룹 표준(BUILD CONTRACT §5)과 정합.
 *
 * 핵심 불변식: 모든 후보는 동일 Content 를 쓰고, Candidate 의 토큰만 다르다.
 * Content 안에 후보별 분기를 절대 두지 않는다.
 */

/* ────────────────────────────────────────────────────────────────────────
 * 후보 식별자 / 요소 단위 선택 항목 — selection.schema.json 의 enum 과 1:1 정합
 * ──────────────────────────────────────────────────────────────────────── */

/** references.json 의 candidate id 와 일치 (candidate-a .. candidate-g). */
export type CandidateId =
  | "candidate-a"
  | "candidate-b"
  | "candidate-c"
  | "candidate-d"
  | "candidate-e"
  | "candidate-f"
  | "candidate-g";

/** 요소 단위 선택 항목 15종 (고정). selection.schema.json 의 element enum 과 일치. */
export type ElementKey =
  | "color"
  | "typography"
  | "navigation"
  | "density"
  | "buttons"
  | "forms"
  | "cards"
  | "tables"
  | "modals"
  | "icons"
  | "spacing"
  | "radius"
  | "shadow"
  | "images"
  | "motion";

/** UI 에서 15종 요소를 순서대로 렌더할 때 쓰는 라벨 목록 (한국어). */
export const ELEMENT_KEYS: ElementKey[] = [
  "color",
  "typography",
  "navigation",
  "density",
  "buttons",
  "forms",
  "cards",
  "tables",
  "modals",
  "icons",
  "spacing",
  "radius",
  "shadow",
  "images",
  "motion",
];

export const ELEMENT_LABELS: Record<ElementKey, string> = {
  color: "색상",
  typography: "타이포그래피",
  navigation: "내비게이션",
  density: "정보 밀도",
  buttons: "버튼",
  forms: "폼",
  cards: "카드",
  tables: "테이블",
  modals: "모달",
  icons: "아이콘",
  spacing: "간격",
  radius: "모서리",
  shadow: "그림자",
  images: "이미지",
  motion: "모션",
};

/* ────────────────────────────────────────────────────────────────────────
 * 콘텐츠 (모든 후보 공통) — public/data/content.json
 * 후보가 달라져도 이 데이터는 절대 갈라지지 않는다.
 * ──────────────────────────────────────────────────────────────────────── */

export type ScreenKey = "dashboard" | "list" | "detail" | "form";

export const SCREEN_ORDER: ScreenKey[] = ["dashboard", "list", "detail", "form"];

export const SCREEN_LABELS: Record<ScreenKey, string> = {
  dashboard: "대시보드",
  list: "목록",
  detail: "상세",
  form: "폼",
};

export interface MetricCard {
  /** 지표 라벨 (예: "이번 달 매출"). */
  label: string;
  /** 표시 값 (예: "₩12,480,000"). 가짜 수치(99%/10x) 금지 — 그럴듯한 실데이터 형태. */
  value: string;
  /** 보조 설명 (예: "지난달 대비 +4건"). 비교 맥락. 없으면 생략. */
  delta?: string;
  /** delta 의 방향 — 색 의미 부여용. */
  trend?: "up" | "down" | "flat";
}

export interface ActivityItem {
  /** 활동 시각 라벨 (예: "오늘 14:20"). */
  time: string;
  /** 활동 내용 한 줄. */
  text: string;
}

export interface DashboardContent {
  title: string;
  subtitle: string;
  metrics: MetricCard[];
  activityTitle: string;
  activity: ActivityItem[];
}

export type RowStatus = "active" | "pending" | "overdue" | "archived";

export interface ListRow {
  id: string;
  /** 1열 — 주체 이름 (예: 고객명). */
  name: string;
  /** 2열 — 분류/태그 라벨. */
  category: string;
  /** 3열 — 금액/수치 표시값. */
  amount: string;
  /** 4열 — 날짜 라벨. */
  date: string;
  /** 5열 — 상태 (색+텍스트로 함께 표기, 색에만 의존 금지). */
  status: RowStatus;
}

export interface ListContent {
  title: string;
  subtitle: string;
  /** 테이블 헤더 라벨 (열 순서대로). */
  columns: string[];
  rows: ListRow[];
  /** 필터 칩 라벨 목록. */
  filters: string[];
  searchPlaceholder: string;
}

export interface DetailField {
  label: string;
  value: string;
}

export interface DetailContent {
  /** 상세 대상 이름. */
  title: string;
  /** 상태 라벨. */
  statusLabel: string;
  status: RowStatus;
  /** 핵심 속성 필드 (키-값). */
  fields: DetailField[];
  /** 본문/메모 단락. */
  bodyTitle: string;
  body: string;
  /** 상세 화면의 거래/이력 라인 (작은 표). */
  timelineTitle: string;
  timeline: { time: string; text: string; amount: string }[];
  /** 1차/2차 액션 라벨. */
  primaryAction: string;
  secondaryAction: string;
}

export interface FormFieldDef {
  /** input name. */
  name: string;
  label: string;
  type: "text" | "email" | "select" | "textarea" | "number" | "date";
  placeholder?: string;
  /** select 일 때 옵션. */
  options?: string[];
  /** 도움말/검증 안내 한 줄 — 색에만 의존하지 않는 상태 전달. */
  hint?: string;
  required?: boolean;
}

export interface FormContent {
  title: string;
  subtitle: string;
  /** 섹션 단위로 묶은 필드 그룹. */
  sections: { heading: string; fields: FormFieldDef[] }[];
  submitLabel: string;
  cancelLabel: string;
}

/** 제품/앱 공통 메타 — 사이드바·헤더 라벨 등 후보 무관 텍스트. */
export interface AppMeta {
  /** 제품 이름 (목업 안 워드마크). */
  productName: string;
  /** 내비게이션 항목 라벨 (대표 화면 4종과 추가 항목). */
  nav: { key: string; label: string }[];
  /** 현재 사용자 표시명 (헤더). */
  userName: string;
  /** 검색 placeholder (전역). */
  searchPlaceholder: string;
}

export interface Content {
  app: AppMeta;
  dashboard: DashboardContent;
  list: ListContent;
  detail: DetailContent;
  form: FormContent;
}

/* ────────────────────────────────────────────────────────────────────────
 * 후보 토큰 (디자인만 다름) — public/data/candidates.json
 * BUILD CONTRACT §5 토큰 그룹 표준 + §4.2 후보 메타.
 * ──────────────────────────────────────────────────────────────────────── */

/** 라이트/다크 한 쌍으로 갈라지는 색 토큰. 각 값은 hex 또는 OKLCH (순수 #000/#fff 금지). */
export interface ColorScheme {
  /** background: base / subtle / muted */
  bgBase: string;
  bgSubtle: string;
  bgMuted: string;
  /** surface: default / raised / sunken */
  surfaceDefault: string;
  surfaceRaised: string;
  surfaceSunken: string;
  /** text: primary / secondary / muted / inverse */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  /** border: default / strong / subtle */
  borderDefault: string;
  borderStrong: string;
  borderSubtle: string;
  /** accent: default / hover / subtle / contrast(전경) */
  accentDefault: string;
  accentHover: string;
  accentSubtle: string;
  accentContrast: string;
  /** semantic */
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  danger: string;
  dangerSurface: string;
  info: string;
  infoSurface: string;
}

export interface TypographyTokens {
  /** display 폰트 family (제목용, weight 800+). */
  fontDisplay: string;
  /** body 폰트 family (본문용, weight 400~500). */
  fontBody: string;
  /** mono 폰트 family (수치/코드). */
  fontMono: string;
  /** 본문 기준 size (px). */
  baseSize: number;
  /** 제목 단계 scale (배수). 클수록 위계 강함. */
  scale: number;
  /** display weight (800~900). */
  displayWeight: number;
  /** body weight (400~500). */
  bodyWeight: number;
  /** 제목 letter-spacing (em). 음수면 타이트. */
  headingTracking: number;
  /** 본문 line-height. */
  bodyLineHeight: number;
}

export interface ShapeTokens {
  /** 기본 모서리 둥글기 (px). 0 = 각짐. */
  radius: number;
  /** 패널/카드 큰 모서리 (px). */
  radiusLarge: number;
  /** 기본 테두리 두께 (px). */
  borderWidth: number;
  /** 그림자 수준. */
  shadow: "none" | "subtle" | "medium" | "strong";
}

export interface SpacingTokens {
  /** 밀도 — 컨트롤·행 높이·패딩 전반의 조밀함. */
  density: "compact" | "comfortable" | "spacious";
  /** 4px 기반 스케일의 단위 (px). compact=4, comfortable=6, spacious=8 등. */
  unit: number;
}

export interface LayoutTokens {
  /** 내비게이션 형태. */
  navigation:
    | "persistent-left-sidebar"
    | "compact-icon-rail"
    | "top-bar"
    | "top-bar-with-subnav";
  /** 콘텐츠 폭 전략. */
  contentWidth: "fixed" | "adaptive" | "fluid";
  /** 목록 표현 — 테이블 우선 vs 카드 우선. */
  listStyle: "table" | "cards" | "rows";
}

export interface MotionTokens {
  level: "none" | "minimal" | "moderate" | "expressive";
  /** 전환 duration (ms). */
  durationMs: number;
}

/** 후보 한 개의 전체 토큰 + 메타. candidates.json 의 각 항목. */
export interface Candidate {
  /** references.json 의 candidate id 와 정합. */
  id: CandidateId;
  /** 후보 이름 (예: "Warm Editorial"). references.json 과 정합. */
  name: string;
  /** 한 줄 인상 키워드. */
  keywords: string[];
  /** 이 후보가 왜/어디에 추천되는지 — SelectionPanel 추천 이유. */
  recommendReason: string;
  /** 어떤 인상인지 설명. */
  description: string;
  /** 어디에 맞는지. */
  recommendedFor: string[];
  /** 주의점. */
  risks: string[];
  /** 라이트/다크 색 토큰 쌍. */
  color: { light: ColorScheme; dark: ColorScheme };
  typography: TypographyTokens;
  shape: ShapeTokens;
  spacing: SpacingTokens;
  layout: LayoutTokens;
  motion: MotionTokens;
}

export interface CandidatesFile {
  project: string;
  generatedAt: string;
  candidates: Candidate[];
}

/* ────────────────────────────────────────────────────────────────────────
 * 선택 결과 — schemas/selection.schema.json 와 정확히 정합
 * design/compare/selection.json 으로 export.
 * ──────────────────────────────────────────────────────────────────────── */

export interface FeedbackEntry {
  candidate: CandidateId;
  element: ElementKey;
  note: string;
}

/** 요소 단위 조합 선택 — 모든 키 optional (일부만 채울 수 있음). */
export type CombinedSelection = Partial<Record<ElementKey, CandidateId>>;

export interface Selection {
  /** 단일 후보 전체 선택 시 그 id, 조합이면 null. */
  selectedCandidate: CandidateId | null;
  /** 요소 단위 조합 (요소 → 후보 id). */
  combinedSelection: CombinedSelection;
  likes: FeedbackEntry[];
  dislikes: FeedbackEntry[];
  notes: string;
  /** 확정 승인 시각(ISO). 이 단계에서는 빈 문자열 — 확정은 /design-select. */
  approvedAt: string;
}

/* ────────────────────────────────────────────────────────────────────────
 * UI 상태 (앱 셸) — 데이터 모델 아님, 도구 조작 상태
 * ──────────────────────────────────────────────────────────────────────── */

export type Viewport = "desktop" | "tablet" | "mobile";
export type ColorMode = "light" | "dark";
export type CompareMode = "single" | "sideBySide";
