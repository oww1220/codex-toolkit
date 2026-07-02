/**
 * AI Design Director — ReferenceProvider 추상화 (계약 타입)
 *
 * 이 파일은 BUILD CONTRACT §12 의 `ReferenceProvider` 인터페이스를 단일 출처로 구현한다.
 * "어떤 레퍼런스 소스(공식 MCP / 브라우저 자동화 / 사용자 URL / 사용자 이미지 / 수동 등록)든
 * **동일한 형태**로 다룬다" 는 계약을 표현하는 타입 집합이다.
 *
 * 설계 의도 (CONTRACT §0 6대 설계 원칙과 정합):
 *   - 원칙 3 "시각 스타일 ↔ UX 구조 분리": {@link ReferenceQuery.axis} 가 두 축을 명시적으로 갈라
 *     같은 제품에 시각 스타일과 UX 구조를 *서로 다른* 레퍼런스에서 가져올 수 있게 한다.
 *   - 원칙 4 "동일 조건 비교": 모든 provider 가 같은 {@link ReferenceResult} 형태를 돌려줘
 *     `/design-compare` 가 후보마다 같은 화면·같은 데이터로 디자인만 바꿔 비교할 수 있다.
 *   - 원칙 6 "모든 결정엔 이유": {@link ReferenceDetail.uxNotes} 등에 "왜 이 요소인가" 를 남긴다.
 *
 * 이 파일에는 **실행 로직이 없다.** provider 구현(web/stitch/manual)이 이 계약을 채운다.
 * 산출 결과는 최종적으로 `design/research/references.json`(CONTRACT §4.2) 의
 * `candidates[]` 로 합성된다 — provider 의 `id`/`name`/`scores` 가 그 후보의 원천이다.
 *
 * 참조 경로(인용은 CONTRACT §3 트리 기준):
 *   - 후보 산출:   design/research/references.json
 *   - 캡처 저장:   design/research/screenshots/
 *   - 토큰 단일출처: design/TOKENS.json
 */

// ---------------------------------------------------------------------------
// 보조 타입 (열거형 성격의 유니온) — CONTRACT 의 enum 명시값과 1:1 정합
// ---------------------------------------------------------------------------

/**
 * 레퍼런스를 탐색하는 두 축.
 *
 * CONTRACT §11 "레퍼런스 분류 축" 과 정합한다. **한 서비스를 통째로 복제하지 않기 위해**
 * (CONTRACT §18) 시각 스타일과 UX 구조를 분리해 질의한다.
 *
 * - `visual-style`: 색상·타이포·표면 질감·여백·모서리·아이콘·이미지 스타일·분위기.
 * - `ux-pattern`:   내비게이션·정보구조·검색·필터·목록/테이블·상세·폼·편집기·빈/오류 상태.
 */
export type ReferenceAxis = 'visual-style' | 'ux-pattern';

/**
 * 제품 유형. `/design-compare` 의 대표 화면 세트(CONTRACT §13)를 고르는 데 쓰인다.
 * 자유 문자열도 허용하되(미래 확장), 알려진 값은 자동완성/검증을 돕도록 좁힌다.
 *
 * - `crm`:       대시보드 / 목록 / 상세 / 폼
 * - `content`:   홈 / 목록 / 상세 / 검색
 * - `commerce`:  상품목록 / 상세 / 장바구니 / 주문
 * - `admin`:     관리자 업무 도구(정보밀도/필터/테이블/일괄작업)
 * - `mobile`:    홈 / 기능 / 상세 / 설정
 */
export type ProductType = 'crm' | 'content' | 'commerce' | 'admin' | 'mobile' | (string & {});

/**
 * 정보 밀도. CONTRACT §4.1 `design-profile.json` 의 `information_density.level` 과 동일 어휘.
 */
export type DensityLevel = 'low' | 'medium' | 'medium-high' | 'high';

/**
 * 캡처 자산의 종류. {@link ReferenceProvider.capture} 가 반환하는 단위.
 *
 * - `screenshot`: 화면 캡처 이미지. `path` 는 `design/research/screenshots/` 하위 상대경로.
 * - `token`:      provider 가 추정한 디자인 토큰 조각(색/폰트/간격). `data` 에 담는다.
 *                 ⚠️ 추정값이며 최종 단일 출처는 `design/TOKENS.json` 이다(CONTRACT §4.4).
 * - `note`:       UX/시각에 대한 텍스트 관찰. `data` 에 담는다.
 */
export type ReferenceAssetKind = 'screenshot' | 'token' | 'note';

// ---------------------------------------------------------------------------
// 핵심 계약 인터페이스 — CONTRACT §12 시그니처를 그대로 따른다
// ---------------------------------------------------------------------------

/**
 * 레퍼런스 탐색 질의.
 *
 * `/design-research` 가 `design/design-profile.json`(번역 단계 산출, CONTRACT §4.1)에서
 * 키워드·인상·밀도를 뽑아 이 질의를 구성한다. **시각 스타일과 UX 구조는 서로 다른 질의**로
 * 던져 한 서비스 통째 복제를 피한다(CONTRACT §3 분리 원칙, §18).
 *
 * @example
 * // 시각 스타일 축 질의
 * const q: ReferenceQuery = {
 *   axis: 'visual-style',
 *   productType: 'crm',
 *   keywords: ['restrained', 'editorial', 'warm-neutral'],
 *   impression: ['신뢰', '전문성'],
 *   density: 'medium-high',
 *   limit: 5,
 * };
 */
export interface ReferenceQuery {
  /** 탐색 축. 시각 스타일 / UX 구조 중 하나. (CONTRACT §11) */
  axis: ReferenceAxis;
  /** 제품 유형. 대표 화면 세트 선택과 적합성 평가에 쓰인다. 선택. */
  productType?: ProductType;
  /**
   * 탐색 키워드. `design-profile.json` 의 `visual_tone` / `typography.direction` 등에서 파생.
   * 예: `['restrained', 'editorial', 'humanist-sans']`.
   */
  keywords: string[];
  /**
   * 목표 브랜드 인상(우선순위 상위 항목). 예: `['신뢰', '전문성', '차분함']`.
   * `design-profile.json` 의 `brand_impression[].trait` 에서 파생. 선택.
   */
  impression?: string[];
  /** 목표 정보 밀도. 후보의 밀도 적합성 평가에 쓰인다. 선택. */
  density?: DensityLevel;
  /** 반환 후보 상한. 기본 5 (CONTRACT §4.2: 후보 3~7개, 기본 5). 선택. */
  limit?: number;
}

/**
 * 탐색 결과 한 건(요약). `search()` 가 배열로 반환한다.
 *
 * 이 단계는 **얕은 목록**이다 — 사용자에게 후보 풀을 보여주고 추리는 용도.
 * 화면 캡처/토큰 추정 같은 무거운 작업은 {@link ReferenceProvider.getDetail} 과
 * {@link ReferenceProvider.capture} 에서 한다.
 *
 * `id` 는 provider 안에서 안정적이어야 한다(같은 레퍼런스 → 같은 id). 단,
 * `references.json` 의 `candidate-a..g` 슬롯 id 와는 다르다 — 후보 슬롯 배정은
 * `/design-research` 가 한다(아래 주: provider id ≠ candidate 슬롯 id).
 */
export interface ReferenceResult {
  /** provider 안에서 안정적인 식별자(같은 레퍼런스면 같은 값). 예: 'web:linear-app'. */
  id: string;
  /** 사람이 읽는 이름. 예: 'Linear — Compact Productivity'. */
  name: string;
  /** 출처 서비스/사이트 이름. `references.json` 의 `source.name` 으로 승격된다. */
  sourceName: string;
  /** 출처 URL. `references.json` 의 `source.url` 으로 승격된다. */
  sourceUrl: string;
  /** 이 결과가 속한 탐색 축. 질의 축과 일치. */
  axis: ReferenceAxis;
  /** 이 레퍼런스를 특징짓는 키워드. */
  keywords: string[];
  /** 썸네일 이미지 경로 또는 URL. 없을 수 있다. */
  thumbnail?: string;
  /** 한 줄 요약(왜 이 레퍼런스가 후보가 됐는가). 없을 수 있다. */
  summary?: string;
}

/**
 * 탐색 결과의 상세. `getDetail(id)` 가 반환한다.
 *
 * {@link ReferenceResult} 를 확장해 화면 단위 관찰과 토큰 추정·UX 메모를 더한다.
 * 이 상세가 `references.json` 후보의 `apply` / `doNotApply` / `strengths` / `risks` /
 * `expectedImpression` 을 채우는 근거가 된다.
 */
export interface ReferenceDetail extends ReferenceResult {
  /**
   * 관찰한 화면들. 각 항목은 한 화면(예: 목록, 상세, 폼)에 대한 캡처 참조 + 관찰.
   * 이미지는 `design/research/screenshots/` 에 저장되고 여기에 상대경로로 참조된다.
   */
  screens: ReferenceScreen[];
  /**
   * provider 가 추정한 디자인 토큰(부분). ⚠️ **추정**이며 단일 출처가 아니다 —
   * 최종 토큰은 `/design-system` 이 `design/TOKENS.json` 에 확정한다(CONTRACT §4.4).
   * 색/폰트/간격을 사용자 비교 단계의 시드로만 쓴다.
   */
  tokensGuess?: TokensGuess;
  /**
   * UX 구조 관찰 메모(내비게이션·정보구조·상태 처리 등). `ux-pattern` 축에서 핵심.
   * 각 메모는 "어떤 요소가 어떤 사용자 행동을 돕는가"(CONTRACT 원칙 6)를 적는다.
   */
  uxNotes?: string[];
}

/**
 * 한 레퍼런스에서 관찰한 단일 화면.
 * `ReferenceDetail.screens[]` 의 원소. {@link ReferenceProvider.capture} 의 입력이 된다.
 */
export interface ReferenceScreen {
  /** 화면 식별자. 예: 'list', 'detail', 'form', 'dashboard'. */
  id: string;
  /** 화면 이름(사람용). 예: '고객 목록'. */
  name: string;
  /** 이 화면을 캡처한 소스 URL(없으면 사용자 제공 이미지 등). */
  url?: string;
  /** 캡처 이미지 상대경로. `design/research/screenshots/` 기준. 캡처 전이면 비어 있다. */
  screenshot?: string;
  /** 이 화면에서 관찰한 핵심 메모(레이아웃·정보구조·상태). */
  notes?: string[];
}

/**
 * provider 가 추정한 토큰 조각. 모든 필드 선택 — provider 능력에 따라 부분만 채운다.
 * 키 형태는 `design/TOKENS.json`(CONTRACT §4.4/§5) 그룹과 정합하나, **추정값**임에 유의.
 */
export interface TokensGuess {
  /** 색상 추정. OKLCH 또는 hex 문자열. 순수 #000/#fff 는 피한다(CONTRACT §1 자가검열). */
  color?: Record<string, string>;
  /** 폰트 패밀리 추정. 예: { display: '...', body: '...' }. */
  fontFamily?: Record<string, string>;
  /** 간격 스케일 추정(4px 기반 권장). */
  spacing?: Record<string, string>;
  /** 모서리 반경 추정. */
  radius?: Record<string, string>;
}

/**
 * 캡처 산출 자산. `capture()` 가 배열로 반환한다.
 *
 * CONTRACT §12 시그니처: `{ kind; path?; data? }`.
 * - `kind === 'screenshot'` → `path` 사용(이미지 파일 경로, `screenshots/` 하위).
 * - `kind === 'token' | 'note'` → `data` 사용(직렬화된 토큰 추정 / 텍스트 관찰).
 */
export interface ReferenceAsset {
  /** 자산 종류. */
  kind: ReferenceAssetKind;
  /** 파일 경로(이미지 등). `design/research/screenshots/` 기준 상대경로 권장. */
  path?: string;
  /** 인라인 데이터(토큰 추정 직렬화·노트 텍스트). 이미지가 아닌 자산에 쓴다. */
  data?: string;
}

/**
 * 레퍼런스 provider 계약 (CONTRACT §12).
 *
 * 모든 구현(web/stitch/manual)은 이 세 메서드를 동일 시그니처로 제공해야 한다.
 * `/design-research` 는 provider 가 무엇이든 신경 쓰지 않고 이 계약만 호출한다 —
 * 우선순위(공식 MCP > 브라우저 자동화 > 사용자 URL > 사용자 이미지 > 수동)에 따라
 * 어떤 구현을 쓸지는 `providers/README.md` 의 정책과 런타임 가용성이 결정한다.
 *
 * 구현 주의:
 *   - 실제 네트워크/MCP 호출은 스킬 에이전트(LLM)가 도구로 수행한다. TS 파일은
 *     "에이전트가 따를 절차"의 골격이다. **환상 API(가짜 fetch URL)를 지어내지 말 것.**
 *   - 미지원 기능은 throw 로 명확히 신호하고(또는 graceful fallback), any 남용을 피한다.
 */
export interface ReferenceProvider {
  /** provider 식별 이름. 예: 'web', 'stitch', 'manual'. 로그·우선순위 판정에 쓰인다. */
  readonly name: string;

  /**
   * 질의에 맞는 레퍼런스 후보 풀을 얕게 탐색한다.
   * @param query 탐색 조건(축·키워드·인상·밀도·상한).
   * @returns 요약 결과 배열(최대 `query.limit`, 기본 5).
   */
  search(query: ReferenceQuery): Promise<ReferenceResult[]>;

  /**
   * 단일 결과를 상세로 확장한다(화면 단위 관찰 + 토큰 추정 + UX 메모).
   * @param id `search()` 가 돌려준 `ReferenceResult.id`.
   * @returns 상세 정보.
   */
  getDetail(id: string): Promise<ReferenceDetail>;

  /**
   * 상세의 화면들을 캡처해 자산으로 만든다(스크린샷 + 토큰/노트).
   * 이미지는 `design/research/screenshots/` 에 저장하고 경로를 반환한다.
   * @param reference 캡처 대상 상세.
   * @returns 캡처 자산 배열.
   */
  capture(reference: ReferenceDetail): Promise<ReferenceAsset[]>;
}

// ---------------------------------------------------------------------------
// 공용 유틸 타입 (구현 공유) — 계약 외 보조
// ---------------------------------------------------------------------------

/**
 * provider 가용성 신호. 우선순위 선택(README 정책)에서 쓰인다.
 * MCP 미연결 등으로 못 쓰는 provider 는 `available:false` + 이유를 명시해
 * `/design-research` 가 다음 우선순위로 graceful 하게 넘어가게 한다(throw 남발 금지).
 */
export interface ProviderAvailability {
  /** provider 이름. */
  provider: string;
  /** 현재 호출 가능한가. */
  available: boolean;
  /** 사용 불가 사유(사용자에게 보여줄 한국어 메시지). available=false 일 때 채운다. */
  reason?: string;
}
