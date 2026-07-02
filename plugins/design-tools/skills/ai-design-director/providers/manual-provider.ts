/**
 * ManualProvider — 사용자가 직접 준 레퍼런스 등록 provider
 *
 * 우선순위(README 정책)에서 **사용자 URL / 사용자 이미지 / 수동 등록** 자리를 담당한다.
 * 자동 탐색(공식 MCP·WebProvider)이 막히거나, 사용자가 "이 사이트/이 이미지/우리 기존 디자인을
 * 레퍼런스로 써라" 라고 명시할 때 쓴다. — CONTRACT 원칙 2 "말보다 선택을 신뢰" 의 입력 경로.
 *
 * 자동 탐색과 달리 이 provider 는 **검색하지 않는다.** 사용자가 미리 등록한 항목
 * (URL / 로컬 이미지 / 로컬 기존 디자인)을 그대로 ReferenceResult/Detail/Asset 으로 *변환*만 한다.
 * 그래서 네트워크/MCP 가 전혀 없어도 항상 동작하는 최종 안전망이다.
 *
 * 등록 형태 3종(모두 사용자 제공):
 *   1. url   — 참고할 서비스/페이지 URL. (캡처는 별도 도구가 필요; 여기선 메타만 보관)
 *   2. image — 사용자가 가진 스크린샷/디자인 시안 이미지 경로.
 *   3. local — 사용자 프로젝트의 기존 디자인(스크린샷·기존 화면 캡처) 경로.
 *
 * 산출 흐름은 다른 provider 와 동일하다:
 *   search()    → 등록 항목을 후보 풀로 노출(질의 무시, 등록분 전체).
 *   getDetail() → 등록된 화면/메모를 상세로.
 *   capture()   → 이미 로컬에 있는 이미지를 screenshot 자산으로(복사/이동은 호출자 책임).
 */

import type {
  ReferenceProvider,
  ReferenceQuery,
  ReferenceResult,
  ReferenceDetail,
  ReferenceAsset,
  ReferenceScreen,
  ReferenceAxis,
  TokensGuess,
} from './types';

/**
 * 사용자가 등록하는 레퍼런스 한 건.
 *
 * `/design-research` 가 사용자에게 "참고할 URL/이미지/기존 디자인이 있나요?" 를 물어
 * (AskUserQuestion) 받은 입력을 이 형태로 만들어 ManualProvider 에 넘긴다.
 */
export interface ManualEntry {
  /** 등록 종류. */
  kind: 'url' | 'image' | 'local';
  /** 사람이 읽는 이름. 예: '우리 v1 대시보드', 'Notion 사이드바'. */
  name: string;
  /** 탐색 축. 사용자가 "이건 색감 참고 / 이건 정보구조 참고" 로 의도를 밝힌다. */
  axis: ReferenceAxis;
  /** kind==='url' 일 때 URL. */
  url?: string;
  /**
   * kind==='image' | 'local' 일 때 로컬 이미지 경로(들).
   * design/research/screenshots/ 로 옮겨질 수 있으나 그 복사/이동은 호출자(스크립트) 책임.
   */
  imagePaths?: string[];
  /** 사용자가 붙인 메모(왜 이걸 참고하는가). */
  notes?: string[];
  /** 사용자가 직접 지정한 키워드. */
  keywords?: string[];
  /** 사용자가 알고 있는 토큰 단서(브랜드 색 hex 등). ⚠️ 최종은 design/TOKENS.json. */
  tokensGuess?: TokensGuess;
}

/** ManualProvider 생성 옵션. */
export interface ManualProviderOptions {
  /** 사용자가 등록한 레퍼런스 목록. 비어 있으면 search 가 빈 배열을 돌려준다(정상). */
  entries?: ManualEntry[];
}

/**
 * 수동 등록 provider.
 *
 * 생성 시 등록 항목을 받거나, 런타임에 {@link register} 로 추가한다.
 * 다른 provider 와 달리 throw 가 거의 없다 — 입력이 비면 빈 결과를 반환하는 것이 정상이기 때문.
 */
export class ManualProvider implements ReferenceProvider {
  public readonly name = 'manual';

  private readonly entries: ManualEntry[];

  constructor(options: ManualProviderOptions = {}) {
    this.entries = options.entries ? [...options.entries] : [];
  }

  /** 런타임에 등록 항목을 추가한다(사용자가 추가 URL/이미지를 줄 때). */
  register(entry: ManualEntry): void {
    this.entries.push(entry);
  }

  /**
   * 등록된 항목을 후보 풀로 노출한다.
   *
   * 검색하지 않으므로 `query.keywords`/`impression` 은 정렬·필터 힌트로만 쓸 수 있다(여기선
   * 축 일치만 적용). 등록분이 비면 빈 배열 — `/design-research` 는 이를 보고 자동 탐색 provider 로
   * 보완하거나 사용자에게 추가 입력을 요청한다.
   */
  async search(query: ReferenceQuery): Promise<ReferenceResult[]> {
    const limit = query.limit ?? this.entries.length;
    return this.entries
      .filter((e) => e.axis === query.axis)
      .slice(0, limit)
      .map((e) => this.toResult(e));
  }

  /**
   * 등록 항목의 상세를 구성한다.
   * 이미지/로컬은 각 이미지 경로를 화면 하나씩으로, URL 은 단일 화면으로 본다.
   */
  async getDetail(id: string): Promise<ReferenceDetail> {
    const entry = this.findEntry(id);
    if (!entry) {
      throw new Error(
        `[ManualProvider.getDetail] 등록되지 않은 id '${id}'. ` +
          `register() 로 먼저 등록하거나, search() 가 돌려준 id 를 사용하세요.`,
      );
    }

    const screens: ReferenceScreen[] = [];
    if (entry.kind === 'url' && entry.url) {
      screens.push({ id: 'page', name: entry.name, url: entry.url, notes: entry.notes });
    }
    (entry.imagePaths ?? []).forEach((p, i) => {
      screens.push({
        id: `image-${i + 1}`,
        name: `${entry.name} (${i + 1})`,
        screenshot: p, // 이미 로컬에 존재하는 이미지.
        notes: entry.notes,
      });
    });

    return {
      ...this.toResult(entry),
      screens,
      tokensGuess: entry.tokensGuess,
      uxNotes: entry.notes,
    };
  }

  /**
   * 캡처. 수동 등록은 **이미 로컬에 이미지가 있으므로** 새로 캡처하지 않는다 —
   * 가진 이미지 경로를 screenshot 자산으로 그대로 노출한다.
   * (design/research/screenshots/ 로의 복사/이동이 필요하면 create-comparison.ts 등 호출자가 한다.)
   * URL-only 항목은 캡처할 로컬 이미지가 없으므로 note 자산만 남긴다.
   */
  async capture(reference: ReferenceDetail): Promise<ReferenceAsset[]> {
    const assets: ReferenceAsset[] = [];
    for (const screen of reference.screens) {
      if (screen.screenshot) {
        assets.push({ kind: 'screenshot', path: screen.screenshot });
      }
    }
    if (reference.tokensGuess) {
      assets.push({ kind: 'token', data: JSON.stringify(reference.tokensGuess) });
    }
    if (reference.uxNotes && reference.uxNotes.length > 0) {
      assets.push({ kind: 'note', data: reference.uxNotes.join('\n') });
    }
    // 로컬 이미지가 하나도 없고 URL 만 있으면, 사용자에게 "URL 캡처는 별도 도구 필요" 임을 노트로 남긴다.
    if (assets.length === 0) {
      assets.push({
        kind: 'note',
        data:
          `'${reference.name}' 은 URL 만 등록돼 로컬 이미지가 없습니다. ` +
          `스크린샷이 필요하면 WebProvider 또는 scripts/capture-screenshots.ts 로 캡처하세요.`,
      });
    }
    return assets;
  }

  // -------------------------------------------------------------------------

  /** 등록 항목 → ReferenceResult. id 규칙: 'manual:<slug(name)>'. */
  private toResult(entry: ManualEntry): ReferenceResult {
    return {
      id: `manual:${slugify(entry.name)}`,
      name: entry.name,
      sourceName: entry.kind === 'url' ? hostFromUrl(entry.url ?? '') : '사용자 제공',
      sourceUrl: entry.url ?? '',
      axis: entry.axis,
      keywords: entry.keywords ?? [],
      thumbnail: entry.imagePaths?.[0],
      summary: entry.notes?.[0],
    };
  }

  /** id 로 등록 항목 찾기. */
  private findEntry(id: string): ManualEntry | undefined {
    const slug = id.includes(':') ? id.slice(id.indexOf(':') + 1) : id;
    return this.entries.find((e) => slugify(e.name) === slug);
  }
}

// ---------------------------------------------------------------------------
// 순수 헬퍼
// ---------------------------------------------------------------------------

/** URL 호스트명(파싱 실패 시 원본). */
function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url || '사용자 제공';
  }
}

/** 이름 → slug. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
