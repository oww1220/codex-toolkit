# providers/ — ReferenceProvider 추상화

레퍼런스 탐색을 **특정 서비스에 종속시키지 않기 위한 어댑터 계층**이다. 공식 MCP가 붙든,
브라우저 자동화로 긁든, 사용자가 URL·이미지를 직접 주든 — `/design-research` 단계는
**같은 계약(`ReferenceProvider`)** 하나만 호출한다. 소스가 무엇으로 바뀌어도 후보 산출 형태
(`design/research/references.json`)는 동일하다.

> 핵심: 이 스킬의 탐색·캡처·목업 생성은 1차적으로 **에이전트(LLM)가 도구를 써서** 수행한다.
> 여기 TS 파일들은 "어떤 소스든 동일 형태로 다룬다"는 **계약/어댑터 골격**이다. MCP가 붙으면
> 실제 호출로 채워질 자리는 *주입형 훅*(`agentTools` / `bridge`)으로 명시했고, 주입이 없으면
> 명확히 throw 하거나 미지원을 신호한다. **환상 API(가짜 fetch·가짜 MCP 호출)는 두지 않는다.**

---

## 파일

| 파일 | 역할 | 상태 |
|------|------|------|
| `types.ts` | 계약 타입 — `ReferenceQuery` / `ReferenceResult` / `ReferenceDetail` / `ReferenceAsset` / `ReferenceProvider` + 보조 타입 | **계약(공통)** |
| `web-provider.ts` | WebSearch/WebFetch 기반 자동 탐색 | **기본(default)** — 항상 동작 |
| `stitch-provider.ts` | Stitch MCP(`mcp__stitch__*`) 어댑터 | **옵션** — MCP 연결 시에만 |
| `manual-provider.ts` | 사용자 URL·이미지·로컬 기존 디자인 등록 | **기본(안전망)** — 입력만 있으면 동작 |

---

## 계약 (`types.ts`)

```ts
interface ReferenceProvider {
  readonly name: string;
  search(query: ReferenceQuery): Promise<ReferenceResult[]>;   // 후보 풀(얕은 목록)
  getDetail(id: string): Promise<ReferenceDetail>;             // 화면 + 토큰추정 + UX메모
  capture(reference: ReferenceDetail): Promise<ReferenceAsset[]>; // 스크린샷 + 토큰/노트 자산
}
```

세 단계로 무겁기를 나눈다 — **얕게 많이(search) → 골라서 깊게(getDetail) → 고른 것만 캡처(capture)**.

- `ReferenceQuery.axis` 는 `'visual-style' | 'ux-pattern'`. **시각 스타일과 UX 구조를 분리 질의**해
  한 서비스 통째 복제를 피한다(BUILD CONTRACT §11/§18). 같은 제품에 시각은 A 레퍼런스, 정보구조는
  B 레퍼런스에서 가져올 수 있다(원칙 3).
- `ReferenceDetail.tokensGuess` 는 **추정값**이다. 최종 토큰 단일 출처는 `design/TOKENS.json`
  (`/design-system` 산출, CONTRACT §4.4)이다 — 비교 단계의 *시드*로만 쓴다.
- `ReferenceAsset.kind === 'screenshot'` → `path`(이미지, `design/research/screenshots/` 하위),
  `'token' | 'note'` → `data`(직렬화/텍스트).

### provider id ≠ candidate 슬롯 id

provider 가 돌려주는 `ReferenceResult.id`(예: `web:linear-app`, `stitch:<id>`, `manual:<slug>`)는
**provider 내부 식별자**다. `references.json` 의 `candidate-a..g` 슬롯 배정은 `/design-research` 가
한다(후보 다양성·구별성을 보고 추려서). 둘을 혼동하지 말 것.

---

## 우선순위 정책 (어떤 provider 를 먼저 쓰는가)

`/design-research` 는 아래 순서로 가용한 첫 provider 를 쓰되, **부족하면 다음으로 보완**한다
(한 provider 가 후보를 충분히 못 채우면 다음 우선순위가 빈자리를 메운다).

```
1. 공식 MCP            → StitchProvider        (isAvailable() === true 일 때만)
2. 브라우저 자동화/검색  → WebProvider           (기본값 — 항상 동작)
3. 사용자 URL          → ManualProvider(kind:'url')
4. 사용자 이미지        → ManualProvider(kind:'image')
5. 수동 등록(기존 디자인) → ManualProvider(kind:'local')
```

### graceful fallback 규칙 (BLOCKING 아님)

- StitchProvider 는 **미가용 시 throw 하지 않는다.** `isAvailable()` 가
  `{ available:false, reason }` 를 돌려주면 `/design-research` 는 호출을 건너뛰고 WebProvider 로 간다.
- provider 의 `search/getDetail/capture` 가 도구/브리지 미주입 상태로 호출되면 그때는 **명확히 throw**
  한다. 이건 "우선순위 선택을 잘못했다"는 빠른 신호다 — 정상 흐름에서는 가용성을 먼저 확인하므로
  도달하지 않는다.
- 어떤 자동 provider 도 후보를 못 만들면 ManualProvider 로 사용자에게 직접 입력을 요청한다
  (AskUserQuestion). 빈손으로 다음 단계를 진행하지 않는다(원칙 1 "생성보다 판단").

선택 로직은 대략 이렇게 읽는다:

```ts
const stitch = new StitchProvider({ bridge });          // bridge 는 런타임이 ToolSearch 로 로드해 주입
const avail = stitch.isAvailable();
const provider = avail.available ? stitch : new WebProvider({ agentTools });
let results = await provider.search(query);
if (results.length < (query.limit ?? 5)) {
  // 부족분을 사용자 등록(ManualProvider)으로 보완
  results = results.concat(await manual.search(query));
}
```

---

## 에이전트 도구 / MCP 브리지 주입

TS 파일은 직접 네트워크를 치지 않는다. 런타임(스킬 에이전트)이 자기 도구를 훅으로 감싸 주입한다.

### WebProvider — `agentTools` 주입 (`WebAgentTools`)

```ts
new WebProvider({
  agentTools: {
    webSearch:  (q)            => /* 에이전트의 WebSearch 도구로 채움 */,
    webFetch:   (url)          => /* 에이전트의 WebFetch 도구로 채움 */,
    captureScreenshot: (url, out) => /* 브라우저 MCP 또는 scripts/capture-screenshots.ts 로 채움 */,
  },
});
```

`agentTools` 가 없으면 `search/getDetail/capture` 는 "에이전트가 채울 자리"임을 알리며 throw 한다.

### StitchProvider — `bridge` 주입 (`StitchMcpBridge`)

스킬 런타임이 ToolSearch 로 `mcp__stitch__*` 도구를 로드한 뒤 브리지로 감싼다:

```ts
// 런타임 예시(개념): ToolSearch("select:mcp__stitch__list_design_systems,mcp__stitch__list_screens,...")
new StitchProvider({
  bridge: {
    listDesignSystems: ()        => /* mcp__stitch__list_design_systems */,
    listScreens:       (dsId)    => /* mcp__stitch__list_screens */,
    fetchScreenCode:   (sid)     => /* mcp__stitch__fetch_screen_code */,
    fetchScreenImage:  (sid, out)=> /* mcp__stitch__fetch_screen_image */,
  },
});
```

`STITCH_TOOL_MAP`(stitch-provider.ts)에 어떤 `mcp__stitch__*` 도구가 어느 단계에 매핑되는지
정리돼 있다. Stitch 의 *생성* 도구(`create_design_system_from_design_md`,
`generate_screen_from_text`, `generate_variants`, `apply_design_system`)는 탐색 계약 밖이며,
`/design-system`·`/design-prototype` 단계에서 목업/시스템 생성에 직접 쓰인다(문서화만).

### ManualProvider — 주입 없음

사용자 입력을 그대로 변환만 하므로 외부 도구가 필요 없다. `/design-research` 가 사용자에게
AskUserQuestion 으로 받은 URL/이미지/기존 디자인을 `ManualEntry[]` 로 만들어 넘긴다.

---

## 새 provider 추가법

예: Figma/Dribbble/사내 디자인 시스템 MCP 등을 붙일 때.

1. **계약 구현.** `new-provider.ts` 에서 `import type { ReferenceProvider, ... } from './types';`
   하고 `class NewProvider implements ReferenceProvider` 로 `name`·`search`·`getDetail`·`capture` 구현.
2. **직접 네트워크 금지.** 실제 호출은 주입형 훅(`agentTools`/`bridge` 패턴)으로 받는다. 환상 API 금지.
3. **id 네임스페이스.** `ReferenceResult.id` 는 `new:<...>` 처럼 provider 접두사를 붙여 충돌을 막는다.
4. **graceful 미지원.** MCP/외부 의존이 있으면 `isAvailable(): ProviderAvailability` 를 제공해
   미가용 시 throw 대신 `{ available:false, reason }` 로 신호한다.
5. **산출 경로 준수.** 스크린샷은 `design/research/screenshots/` 하위에 저장하고 상대경로를 반환한다.
   토큰 추정은 어디까지나 `tokensGuess`(추정) — 단일 출처는 `design/TOKENS.json`.
6. **우선순위 등록.** 위 "우선순위 정책" 순서 중 어디에 들어가는지 정하고 이 README 표/순서에 추가한다.
7. **타입 체크.** `tsc --noEmit --strict` 통과. `any` 남용 금지, 미구현부는 명확한 에러 + `TODO` 주석.

스켈레톤:

```ts
import type {
  ReferenceProvider, ReferenceQuery, ReferenceResult, ReferenceDetail,
  ReferenceAsset, ProviderAvailability,
} from './types';

export class NewProvider implements ReferenceProvider {
  public readonly name = 'new';
  isAvailable(): ProviderAvailability {
    // 외부 의존 가용성 확인. 미가용이면 { available:false, reason } 반환(throw 금지).
    return { provider: this.name, available: false, reason: 'TODO: 가용성 확인 미구현' };
  }
  async search(_q: ReferenceQuery): Promise<ReferenceResult[]> {
    throw new Error('[NewProvider.search] TODO: 주입형 훅으로 구현하세요.');
  }
  async getDetail(_id: string): Promise<ReferenceDetail> {
    throw new Error('[NewProvider.getDetail] TODO');
  }
  async capture(_ref: ReferenceDetail): Promise<ReferenceAsset[]> {
    throw new Error('[NewProvider.capture] TODO');
  }
}
```

---

## 관련 산출물 (BUILD CONTRACT §3)

| 경로 | provider 가 기여하는 것 |
|------|------------------------|
| `design/research/references.json` | `search`+`getDetail` 결과 → `candidates[]`(apply/doNotApply/strengths/risks/scores 근거) |
| `design/research/screenshots/` | `capture` 의 `screenshot` 자산 png |
| `design/research/REFERENCE-REPORT.md` | provider 관찰을 사람이 읽는 리포트로 정리 |
| `design/TOKENS.json` | `tokensGuess` 는 *시드*일 뿐, 최종 토큰은 `/design-system` 이 여기에 확정 |

소비처: `scripts/create-comparison.ts` 가 `references.json`(+토큰 추정)을 읽어
`design/compare/data/{content.json,candidates.json}` 시드를 만든다(콘텐츠는 후보 공통, 디자인만 다름).
