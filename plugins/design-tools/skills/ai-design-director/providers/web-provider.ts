/**
 * WebProvider — WebSearch/WebFetch 기반 기본 레퍼런스 provider (default)
 *
 * 우선순위(README 정책)에서 **공식 MCP 다음, 사용자 URL/이미지/수동보다 위**의 자동 탐색 경로다.
 * MCP 가 없어도 항상 동작하므로 이 스킬의 *기본값*이다.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ⚠️ 이 파일은 "코드처럼 보이는 절차 명세"다.
 * ───────────────────────────────────────────────────────────────────────────
 * 실제 웹 검색·페이지 fetch·스크린샷은 **스킬 에이전트(LLM)가 도구로 직접 수행**한다
 * (WebSearch / WebFetch / 브라우저 MCP / scripts/capture-screenshots.ts).
 * 따라서 이 클래스는 **에이전트가 따라야 할 검색 → 평가 → 캡처 절차**를 코드 구조 +
 * 상세 주석으로 표현한 *어댑터 골격*이다.
 *
 * 환상 API(존재하지 않는 fetch 래퍼·가짜 엔드포인트)를 지어내지 않는다. 도구로 채워질 자리는
 * `agentTools` 훅(주입형)으로 명시하고, 주입이 없으면 명확히 throw 하여 "에이전트가 채울 자리"임을
 * 드러낸다. — CONTRACT §12 주: "환상 API 호출을 지어내지 말 것."
 *
 * 산출 흐름(CONTRACT §3 트리):
 *   search()    → 후보 풀(요약)  → /design-research 가 candidate-a..g 슬롯에 배정
 *   getDetail() → 화면·토큰추정·UX메모 → references.json 의 apply/doNotApply/strengths/risks 근거
 *   capture()   → design/research/screenshots/ 에 png + 토큰/노트 자산
 */

import type {
  ReferenceProvider,
  ReferenceQuery,
  ReferenceResult,
  ReferenceDetail,
  ReferenceAsset,
  ReferenceScreen,
} from './types';

/**
 * 에이전트(LLM)가 런타임에 주입하는 도구 훅.
 *
 * 이 인터페이스는 **WebProvider 가 직접 네트워크를 치지 않는다**는 사실을 코드로 못박는다.
 * 각 메서드는 스킬 에이전트가 자신의 도구(WebSearch/WebFetch/브라우저 MCP/캡처 스크립트)로
 * 채운다. 주입되지 않으면 WebProvider 는 동작하지 않고 명확한 에러를 던진다.
 *
 * 구현 노트: 이 훅들의 시그니처는 "에이전트가 무엇을 해줘야 하는가"의 계약일 뿐,
 * 특정 HTTP 클라이언트나 엔드포인트를 전제하지 않는다.
 */
export interface WebAgentTools {
  /**
   * 웹 검색. 에이전트의 WebSearch 도구가 채운다.
   * @param queryString 사람이 읽는 검색 질의(키워드 조합).
   * @returns 검색 결과(제목·URL·스니펫) 목록.
   */
  webSearch(queryString: string): Promise<WebSearchHit[]>;
  /**
   * 페이지 본문/메타 가져오기. 에이전트의 WebFetch 도구가 채운다.
   * @param url 가져올 페이지 URL.
   * @returns 페이지에서 추출한 구조화 관찰(제목·요약·관찰 메모·후보 화면 URL).
   */
  webFetch(url: string): Promise<WebPageObservation>;
  /**
   * 화면 캡처. 에이전트가 브라우저 MCP 또는 scripts/capture-screenshots.ts 로 채운다.
   * @param url 캡처할 화면 URL.
   * @param outPath design/research/screenshots/ 하위 저장 경로(상대).
   * @returns 실제 저장된 상대경로.
   */
  captureScreenshot(url: string, outPath: string): Promise<string>;
}

/** WebSearch 결과 한 건(에이전트 도구가 돌려주는 최소 형태). */
export interface WebSearchHit {
  title: string;
  url: string;
  snippet?: string;
}

/** WebFetch 가 한 페이지에서 추출한 관찰. 에이전트가 본문을 읽고 구조화한다. */
export interface WebPageObservation {
  /** 페이지 제목/서비스 이름. */
  title: string;
  /** 페이지 한 줄 요약. */
  summary?: string;
  /** 관찰 메모(시각/UX). */
  notes?: string[];
  /** 캡처 후보 화면 목록(이름 + URL). */
  candidateScreens?: { id: string; name: string; url: string }[];
  /** 추정 토큰 단서(색/폰트 등) — 본문·OG 이미지·CSS 단서에서 추정. */
  tokenHints?: { color?: Record<string, string>; fontFamily?: Record<string, string> };
}

/**
 * WebProvider 생성 옵션.
 */
export interface WebProviderOptions {
  /**
   * 에이전트 도구 훅. 주입되지 않으면 search/getDetail/capture 가 throw 한다
   * (= "이 자리는 스킬 에이전트가 채운다"는 신호).
   */
  agentTools?: WebAgentTools;
  /** 스크린샷 저장 루트(상대). 기본 'design/research/screenshots'. */
  screenshotDir?: string;
}

/**
 * 기본 provider 구현.
 *
 * 절차(에이전트 플레이북):
 *   1. search:  design-profile 키워드+인상+축 → 검색 질의 문자열 빌드 → webSearch →
 *               서로 **충분히 구별되는** 후보만 추려 ReferenceResult[] 로 정규화.
 *   2. getDetail: 후보 URL 을 webFetch → 화면/토큰추정/UX메모로 확장.
 *   3. capture: 화면별 screenshot 저장 + 토큰추정/노트 자산화.
 */
export class WebProvider implements ReferenceProvider {
  public readonly name = 'web';

  private readonly tools?: WebAgentTools;
  private readonly screenshotDir: string;

  constructor(options: WebProviderOptions = {}) {
    this.tools = options.agentTools;
    this.screenshotDir = options.screenshotDir ?? 'design/research/screenshots';
  }

  /**
   * 후보 풀을 얕게 탐색한다.
   *
   * 에이전트 절차:
   *   (a) 질의 키워드·인상·축으로 검색 문자열을 만든다. axis 가 `visual-style` 이면
   *       "색/타이포/분위기" 류, `ux-pattern` 이면 "내비/정보구조/테이블/폼" 류 어휘를 보탠다.
   *       — 시각/UX 를 분리 검색해 한 서비스 통째 복제를 피한다(CONTRACT §11/§18).
   *   (b) webSearch 로 후보 URL 을 모은다.
   *   (c) 후보가 **서로 시각적으로 충분히 구별**되도록 추린다(CONTRACT §4.2 규칙).
   *       비슷한 후보만 남으면 비교(원칙 4)가 무의미해진다.
   *   (d) limit(기본 5) 만큼 ReferenceResult[] 로 정규화.
   */
  async search(query: ReferenceQuery): Promise<ReferenceResult[]> {
    const tools = this.requireTools('search');
    const limit = query.limit ?? 5;

    const queryString = buildSearchQuery(query);
    const hits = await tools.webSearch(queryString);

    // 정규화: 검색 히트를 ReferenceResult 로. 구별성 필터/추림은 에이전트가
    // 후보 다양성을 판단해 수행한다(여기서는 형태만 보장). limit 으로 자른다.
    const results: ReferenceResult[] = hits.slice(0, limit).map((hit) => ({
      id: `web:${slugFromUrl(hit.url)}`,
      name: hit.title,
      sourceName: hostFromUrl(hit.url),
      sourceUrl: hit.url,
      axis: query.axis,
      keywords: query.keywords,
      summary: hit.snippet,
    }));

    return results;
  }

  /**
   * 단일 후보를 상세로 확장한다.
   *
   * 에이전트 절차:
   *   (a) id → URL 복원 후 webFetch 로 본문/메타/스크린 후보를 읽는다.
   *   (b) 관찰을 ReferenceScreen[] 로 구조화(아직 캡처 전이라 screenshot 은 비움).
   *   (c) 시각 단서를 tokensGuess 로(⚠️ 추정값 — 최종은 design/TOKENS.json), UX 관찰을 uxNotes 로.
   */
  async getDetail(id: string): Promise<ReferenceDetail> {
    const tools = this.requireTools('getDetail');
    const url = urlFromId(id);
    const page = await tools.webFetch(url);

    const screens: ReferenceScreen[] = (page.candidateScreens ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      notes: page.notes,
    }));

    return {
      id,
      name: page.title,
      sourceName: hostFromUrl(url),
      sourceUrl: url,
      // axis 는 getDetail 단독으로는 알 수 없다 — search 결과에서 운반하는 것이 정석이다.
      // 단독 호출 시 호출자가 알려주도록 'visual-style' 을 안전 기본값으로 두되,
      // /design-research 는 search 의 axis 를 detail 로 전파하는 것을 권장한다.
      axis: 'visual-style',
      keywords: [],
      summary: page.summary,
      screens,
      tokensGuess: page.tokenHints,
      uxNotes: page.notes,
    };
  }

  /**
   * 상세의 화면들을 캡처해 자산으로 만든다.
   *
   * 에이전트 절차:
   *   (a) 각 ReferenceScreen.url 을 captureScreenshot 으로 png 저장 →
   *       design/research/screenshots/<provider>-<refSlug>-<screenId>.png.
   *   (b) tokensGuess 가 있으면 'token' 자산으로, uxNotes 가 있으면 'note' 자산으로 직렬화.
   *
   * 반환된 screenshot path 들은 /design-research 가 references.json 후보의
   * `screenshots[]` 로 승격한다.
   */
  async capture(reference: ReferenceDetail): Promise<ReferenceAsset[]> {
    const tools = this.requireTools('capture');
    const assets: ReferenceAsset[] = [];
    const refSlug = slugFromId(reference.id);

    for (const screen of reference.screens) {
      if (!screen.url) continue; // 캡처할 URL 이 없는 화면은 건너뛴다.
      const outPath = `${this.screenshotDir}/${refSlug}-${screen.id}.png`;
      const savedPath = await tools.captureScreenshot(screen.url, outPath);
      assets.push({ kind: 'screenshot', path: savedPath });
    }

    if (reference.tokensGuess) {
      assets.push({ kind: 'token', data: JSON.stringify(reference.tokensGuess) });
    }
    if (reference.uxNotes && reference.uxNotes.length > 0) {
      assets.push({ kind: 'note', data: reference.uxNotes.join('\n') });
    }

    return assets;
  }

  /**
   * 도구 훅 가드. 주입되지 않았으면 "에이전트가 채울 자리"임을 명확히 알리고 throw 한다.
   * — 조용히 빈 배열을 돌려 환상 동작을 흉내내지 않는다.
   */
  private requireTools(method: string): WebAgentTools {
    if (!this.tools) {
      throw new Error(
        `[WebProvider.${method}] 에이전트 도구(WebAgentTools)가 주입되지 않았습니다. ` +
          `이 provider 는 직접 네트워크를 호출하지 않습니다 — 스킬 에이전트가 ` +
          `WebSearch/WebFetch/브라우저 MCP 로 agentTools 를 채워 주입해야 합니다. ` +
          `(providers/README.md "에이전트 도구 주입" 참조)`,
      );
    }
    return this.tools;
  }
}

// ---------------------------------------------------------------------------
// 순수 헬퍼 (네트워크 없음 — 문자열/URL 정규화만)
// ---------------------------------------------------------------------------

/**
 * 질의를 검색 문자열로 빌드한다.
 * 축에 따라 보조 어휘를 더해 시각/UX 를 분리 검색한다(CONTRACT §11).
 */
export function buildSearchQuery(query: ReferenceQuery): string {
  const parts: string[] = [...query.keywords];
  if (query.impression && query.impression.length > 0) parts.push(...query.impression);
  if (query.productType) parts.push(String(query.productType));

  // 축별 보조 어휘. 시각 스타일과 UX 구조를 다른 키워드로 탐색.
  const axisTerms =
    query.axis === 'visual-style'
      ? ['UI design', 'color', 'typography', 'visual style']
      : ['UX pattern', 'navigation', 'information architecture', 'data table'];
  parts.push(...axisTerms);

  if (query.density) parts.push(`${query.density} density`);
  return parts.filter(Boolean).join(' ');
}

/** URL 호스트명 추출(파싱 실패 시 원본 반환). */
export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** URL → 안정적 slug(호스트 + 첫 경로 세그먼트). id 구성에 쓰인다. */
export function slugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean)[0] ?? '';
    return slugify(`${u.hostname.replace(/^www\./, '')}-${seg}`);
  } catch {
    return slugify(url);
  }
}

/** provider id('web:<slug>') → slug 부분만. capture 파일명에 쓰인다. */
export function slugFromId(id: string): string {
  return id.includes(':') ? id.slice(id.indexOf(':') + 1) : slugify(id);
}

/**
 * provider id → URL 복원.
 *
 * ⚠️ id 는 slug 라 URL 무손실 복원이 보장되지 않는다. 정석은 /design-research 가
 * search 결과의 `sourceUrl` 을 detail 호출까지 운반하는 것이다. 이 헬퍼는 id 가
 * 완전한 URL(`web:https://...`)을 담은 경우만 복원하고, 아니면 명확히 throw 한다.
 */
export function urlFromId(id: string): string {
  const body = id.includes(':') ? id.slice(id.indexOf(':') + 1) : id;
  if (/^https?:\/\//.test(body)) return body;
  throw new Error(
    `[WebProvider] id '${id}' 에서 URL 을 복원할 수 없습니다. ` +
      `getDetail 호출 시 search 결과의 sourceUrl 을 운반하거나, ` +
      `id 에 전체 URL 을 담으세요(web:https://...).`,
  );
}

/** 일반 slugify(소문자·하이픈·영숫자만). */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
