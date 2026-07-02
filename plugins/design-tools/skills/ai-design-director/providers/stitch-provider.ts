/**
 * StitchProvider — (옵션) Stitch MCP 어댑터
 *
 * Stitch MCP(`mcp__stitch__*`)가 **연결돼 있을 때만** 동작하는 보조 provider.
 * 우선순위(README 정책)에서 "공식 MCP" 자리에 해당한다 — 가용하면 WebProvider 보다 위.
 * 미가용 시 throw 로 파이프라인을 깨지 않고, {@link ProviderAvailability} 로 **명확한 미지원
 * 신호**를 돌려 `/design-research` 가 다음 우선순위(WebProvider 등)로 graceful 하게 넘어가게 한다.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ⚠️ 실제 MCP 호출부는 이 파일이 직접 들고 있지 않다.
 * ───────────────────────────────────────────────────────────────────────────
 * Stitch MCP 도구는 스킬 런타임이 **ToolSearch 로 로드**한 뒤 에이전트가 호출한다
 * (예: `mcp__stitch__list_design_systems`). 이 어댑터는 그 도구들을 {@link StitchMcpBridge}
 * 훅으로 받아 ReferenceProvider 계약에 매핑하는 *골격*이다. 브리지가 주입되지 않으면
 * "미지원"으로 처리한다(환상 MCP 호출을 지어내지 않는다 — CONTRACT §12 주).
 *
 * 매핑 개요(Stitch 의 강점은 "탐색"이 아니라 "디자인 시스템/스크린 생성"이다):
 *   search()    → list_design_systems / list_projects 로 기존 Stitch 디자인 시스템을
 *                 레퍼런스 후보처럼 노출(있을 때). 없으면 빈 배열(graceful).
 *   getDetail() → get_screen / fetch_screen_code 로 스크린 상세·토큰 단서 확장.
 *   capture()   → fetch_screen_image 로 스크린 이미지를 design/research/screenshots/ 에 저장.
 *
 * 참고: Stitch 의 *생성* 도구(create_design_system_from_design_md / generate_screen_from_text /
 * generate_variants / apply_design_system)는 탐색 계약(ReferenceProvider) 밖이다. 이들은
 * `/design-prototype`·`/design-system` 단계에서 목업/시스템 생성에 직접 쓰이므로,
 * 여기서는 어떤 MCP 도구가 어느 단계에 매핑되는지 {@link STITCH_TOOL_MAP} 로 문서화만 한다.
 */

import type {
  ReferenceProvider,
  ReferenceQuery,
  ReferenceResult,
  ReferenceDetail,
  ReferenceAsset,
  ReferenceScreen,
  ProviderAvailability,
} from './types';

/**
 * Stitch MCP 도구 ↔ 파이프라인 단계 매핑(문서용 상수).
 *
 * 실제 도구 이름은 `mcp__stitch__<여기 키>` 형태다. 런타임에 ToolSearch 로
 * `select:mcp__stitch__list_design_systems,...` 처럼 로드한다.
 * 이 맵은 "어떤 도구가 어느 단계에서 의미를 갖는가"를 한곳에 모아 둔 것이다.
 */
export const STITCH_TOOL_MAP = {
  // 탐색(ReferenceProvider) 매핑 — 이 어댑터가 다루는 범위.
  list_design_systems: 'search: 기존 Stitch 디자인 시스템을 레퍼런스 후보로 노출',
  list_projects: 'search: 기존 프로젝트를 레퍼런스 후보로 노출(보조)',
  list_screens: 'getDetail: 후보의 스크린 목록 → ReferenceScreen[]',
  get_screen: 'getDetail: 단일 스크린 상세',
  fetch_screen_code: 'getDetail: 스크린 코드에서 토큰 단서(tokensGuess) 추출',
  fetch_screen_image: 'capture: 스크린 이미지를 screenshots/ 에 저장',
  // 생성(다른 단계) 매핑 — 이 어댑터 범위 밖, 문서화만.
  create_design_system_from_design_md: '/design-system: design/DESIGN.md → Stitch 디자인 시스템',
  upload_design_md: '/design-system: DESIGN.md 업로드',
  generate_screen_from_text: '/design-prototype: 텍스트 → 스크린 목업',
  generate_variants: '/design-prototype: 한 스크린의 변형안 생성',
  apply_design_system: '/design-prototype: 디자인 시스템을 스크린에 적용',
  update_design_system: '/design-system: 시스템 갱신',
  create_project: '/design-prototype: 프로젝트 생성',
} as const;

/**
 * Stitch MCP 호출 브리지(주입형).
 *
 * 스킬 런타임이 ToolSearch 로 로드한 `mcp__stitch__*` 도구를 이 형태로 감싸 주입한다.
 * 모든 메서드는 선택 — Stitch 버전/권한에 따라 일부만 제공될 수 있다(그래서 부분 가용 처리).
 * 브리지 자체가 없으면(주입 누락) provider 는 "미지원"이다.
 *
 * 각 메서드 반환 형태는 Stitch 응답을 그대로 강제하지 않는다(버전 변동 흡수) — 어댑터가
 * 필요한 필드만 방어적으로 읽는다.
 */
export interface StitchMcpBridge {
  /** mcp__stitch__list_design_systems 매핑. */
  listDesignSystems?(): Promise<StitchDesignSystem[]>;
  /** mcp__stitch__list_screens 매핑. */
  listScreens?(designSystemId: string): Promise<StitchScreen[]>;
  /** mcp__stitch__fetch_screen_code 매핑. 토큰 단서 추출용. */
  fetchScreenCode?(screenId: string): Promise<string>;
  /**
   * mcp__stitch__fetch_screen_image 매핑.
   * @param outPath design/research/screenshots/ 하위 저장 경로.
   * @returns 실제 저장된 상대경로.
   */
  fetchScreenImage?(screenId: string, outPath: string): Promise<string>;
}

/** Stitch 디자인 시스템 요약(어댑터가 읽는 최소 형태). */
export interface StitchDesignSystem {
  id: string;
  name: string;
  /** 분위기/키워드(있으면). */
  keywords?: string[];
  /** 출처 URL(Stitch 콘솔 등, 있으면). */
  url?: string;
  summary?: string;
}

/** Stitch 스크린 요약. */
export interface StitchScreen {
  id: string;
  name: string;
  imageUrl?: string;
}

/** StitchProvider 생성 옵션. */
export interface StitchProviderOptions {
  /** MCP 브리지. 미주입이면 provider 는 미지원으로 동작한다. */
  bridge?: StitchMcpBridge;
  /** 스크린샷 저장 루트(상대). 기본 'design/research/screenshots'. */
  screenshotDir?: string;
}

/**
 * 옵션 Stitch provider.
 *
 * 핵심: **미가용 시 throw 하지 않고** {@link isAvailable} 로 신호한다. search/getDetail/capture
 * 가 호출됐는데 브리지가 없으면 그때는 명확한 에러를 던진다(잘못된 우선순위 선택을 빨리 드러냄).
 * 정상 흐름에서 `/design-research` 는 먼저 isAvailable 을 확인하고, 미가용이면 호출 자체를 건너뛴다.
 */
export class StitchProvider implements ReferenceProvider {
  public readonly name = 'stitch';

  private readonly bridge?: StitchMcpBridge;
  private readonly screenshotDir: string;

  constructor(options: StitchProviderOptions = {}) {
    this.bridge = options.bridge;
    this.screenshotDir = options.screenshotDir ?? 'design/research/screenshots';
  }

  /**
   * 가용성 신호(throw 아님). 우선순위 선택에서 먼저 호출한다.
   * 브리지와 최소 탐색 능력(listDesignSystems)이 있어야 가용으로 본다.
   */
  isAvailable(): ProviderAvailability {
    if (!this.bridge) {
      return {
        provider: this.name,
        available: false,
        reason:
          'Stitch MCP 가 연결되지 않았습니다. 런타임이 ToolSearch 로 mcp__stitch__* 도구를 ' +
          '로드해 StitchMcpBridge 를 주입해야 합니다. 기본 WebProvider 로 진행하세요.',
      };
    }
    if (!this.bridge.listDesignSystems) {
      return {
        provider: this.name,
        available: false,
        reason: 'Stitch 브리지에 listDesignSystems 매핑이 없어 탐색을 지원하지 않습니다.',
      };
    }
    return { provider: this.name, available: true };
  }

  /**
   * 기존 Stitch 디자인 시스템/프로젝트를 레퍼런스 후보로 노출한다.
   * 가용하지 않으면 명확히 throw(우선순위 선택에서 isAvailable 로 미리 걸렀어야 함).
   */
  async search(query: ReferenceQuery): Promise<ReferenceResult[]> {
    const bridge = this.requireBridge('search');
    if (!bridge.listDesignSystems) {
      throw new Error('[StitchProvider.search] listDesignSystems 미지원.');
    }
    const limit = query.limit ?? 5;
    const systems = await bridge.listDesignSystems();

    return systems.slice(0, limit).map((ds) => ({
      id: `stitch:${ds.id}`,
      name: ds.name,
      sourceName: 'Stitch',
      sourceUrl: ds.url ?? '',
      axis: query.axis,
      keywords: ds.keywords ?? query.keywords,
      summary: ds.summary,
    }));
  }

  /**
   * 후보(디자인 시스템)의 스크린 목록과 토큰 단서로 상세를 구성한다.
   */
  async getDetail(id: string): Promise<ReferenceDetail> {
    const bridge = this.requireBridge('getDetail');
    const designSystemId = stripPrefix(id);

    const screensRaw = bridge.listScreens ? await bridge.listScreens(designSystemId) : [];
    const screens: ReferenceScreen[] = screensRaw.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.imageUrl,
    }));

    // 토큰 단서: 첫 스크린 코드에서 색/폰트 추정(있을 때만). ⚠️ 추정값 — 최종은 design/TOKENS.json.
    let tokensGuess: ReferenceDetail['tokensGuess'];
    if (bridge.fetchScreenCode && screensRaw[0]) {
      const code = await bridge.fetchScreenCode(screensRaw[0].id);
      tokensGuess = extractTokenHints(code);
    }

    return {
      id,
      name: designSystemId,
      sourceName: 'Stitch',
      sourceUrl: '',
      axis: 'visual-style',
      keywords: [],
      screens,
      tokensGuess,
      uxNotes: ['Stitch 디자인 시스템 — 토큰/컴포넌트 규약이 명시적이라 시스템 일관성 참조에 적합.'],
    };
  }

  /**
   * 스크린 이미지를 캡처해 screenshots/ 에 저장한다.
   */
  async capture(reference: ReferenceDetail): Promise<ReferenceAsset[]> {
    const bridge = this.requireBridge('capture');
    const assets: ReferenceAsset[] = [];
    const refSlug = stripPrefix(reference.id);

    if (bridge.fetchScreenImage) {
      for (const screen of reference.screens) {
        const outPath = `${this.screenshotDir}/stitch-${refSlug}-${screen.id}.png`;
        const saved = await bridge.fetchScreenImage(screen.id, outPath);
        assets.push({ kind: 'screenshot', path: saved });
      }
    }
    if (reference.tokensGuess) {
      assets.push({ kind: 'token', data: JSON.stringify(reference.tokensGuess) });
    }
    return assets;
  }

  /** 브리지 가드. 미주입 호출은 우선순위 선택 실수이므로 명확히 throw. */
  private requireBridge(method: string): StitchMcpBridge {
    if (!this.bridge) {
      throw new Error(
        `[StitchProvider.${method}] Stitch MCP 브리지가 없습니다. ` +
          `호출 전에 isAvailable() 로 가용성을 확인하고, 미가용 시 WebProvider 로 ` +
          `graceful 하게 넘어가세요. (providers/README.md 우선순위 정책 참조)`,
      );
    }
    return this.bridge;
  }
}

// ---------------------------------------------------------------------------
// 순수 헬퍼
// ---------------------------------------------------------------------------

/** 'stitch:<id>' → '<id>'. */
function stripPrefix(id: string): string {
  return id.includes(':') ? id.slice(id.indexOf(':') + 1) : id;
}

/**
 * 스크린 코드 문자열에서 색/폰트 단서를 얕게 추출한다(정규식 기반, 추정).
 * ⚠️ 결과는 tokensGuess(추정)일 뿐 — 최종 토큰은 design/TOKENS.json 에서 확정한다.
 */
export function extractTokenHints(code: string): ReferenceDetail['tokensGuess'] {
  const color: Record<string, string> = {};
  // hex 색상 수집(순수 #000/#fff 은 시드에서 배제 — CONTRACT §1 자가검열).
  const hexes = Array.from(code.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)).map((m) => m[0]);
  const filtered = hexes.filter((h) => !/^#0{3,6}$/i.test(h) && !/^#f{3,6}$/i.test(h));
  filtered.slice(0, 6).forEach((h, i) => {
    color[`sampled-${i + 1}`] = h.toLowerCase();
  });

  const fontFamily: Record<string, string> = {};
  const fontMatch = code.match(/font-family:\s*([^;"']+)/i);
  if (fontMatch) fontFamily.body = fontMatch[1].trim();

  const guess: ReferenceDetail['tokensGuess'] = {};
  if (Object.keys(color).length) guess.color = color;
  if (Object.keys(fontFamily).length) guess.fontFamily = fontFamily;
  return Object.keys(guess).length ? guess : undefined;
}
