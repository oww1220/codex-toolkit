---
name: design-research
description: 제품·방향에 맞는 실제 서비스 디자인 레퍼런스를 Visual Style·UX Pattern 2축으로 탐색·평가하고 동일 조건 비교용 후보 세트를 만든다. design-profile.json 을 입력으로 받아 research/REFERENCE-REPORT.md + references.json + screenshots/ 를 산출. 트리거 — "레퍼런스 찾아줘", "참고 디자인 조사", "/design-research".
allowed-tools: Read, Write, WebSearch, WebFetch, Bash, AskUserQuestion
---

# /design-research — 디자인 레퍼런스 탐색·평가

9단계 파이프라인의 3번째 단계. **"말보다 선택을 신뢰"** 원칙(BUILD CONTRACT §0-2)을 실행하는
핵심 지점이다. 사용자가 "미니멀하게"라고만 말했을 때, 그 단어를 곧장 코드로 옮기지 않고
**실제 서비스의 디자인을 탐색·비교·선택하게 해서 취향을 발견**시킨다.

> 이 단계는 디자인을 만들지 않는다. **판단의 재료**를 만든다. 후보는 코드가 아니라 *선택지*다.
> 후보를 못 고르겠다면 후보가 서로 충분히 다르지 않은 것이다 — 다양성 규칙(아래 4단계)을 다시 본다.

> **🚫 NO-SKIP 게이트 1 (위반 = 빵점 · SKILL.md/CONTRACT §2 와 동기화)**: 이 단계를 건너뛰고 후보·목업·시안을 만들면 안 된다.
> ① 사용자가 준 레퍼런스(URL·이미지·사이트)는 **반드시 방문·열람**(WebFetch·브라우저) — 안 본 채로 진행 금지.
> ② 안 줬으면 WebSearch / provider 로 **실제 존재하는** 레퍼런스를 찾는다(머릿속·상상 스타일 직행 = 슬롭 = 빵점).
> ③ 본 것을 `design/research/`(`references.json` + 캡처)에 **기록**해야 다음 단계로 간다. 표지·포스터 등 비-화면 산출물도 예외 없다.

---

## 목적

- 제품 유형·사용자·디자인 프로필에 맞는 **실제 디자인 레퍼런스**를 찾는다(상상한 디자인이 아니라 존재하는 서비스).
- **Visual Style 축과 UX Pattern 축을 분리** 탐색한다. 예쁜 마케팅 스타일이 업무용 SaaS에 맞으리란 보장은 없다(원칙 3, 시각 스타일 ↔ UX 구조 분리).
- 각 후보를 **9개 기준**으로 평가하고, 서로 시각적으로 충분히 다른 **3~7개 후보**(기본 5)로 좁힌다.
- 다음 단계(`/design-compare`)가 **동일 콘텐츠로 디자인만 바꿔** 보여줄 수 있도록 토큰 추정치까지 정리한다.

---

## 입력

| 입력 | 경로 | 없을 때 |
|------|------|---------|
| 디자인 프로필 (필수) | `design/design-profile.json` | `/design-translate` 를 먼저 돌리도록 안내. 그래도 진행해야 하면 사용자에게 제품 유형·인상·밀도를 AskUserQuestion 으로 직접 받아 최소 프로필 구성 |
| 디자인 브리프 (참고) | `design/DESIGN-BRIEF.md` | 없어도 진행 (프로필에 핵심이 요약돼 있음) |
| 번역 문서 (참고) | `design/DESIGN-TRANSLATION.md` | 없어도 진행 |
| 사용자 보유 레퍼런스 (선택) | 사용자가 준 URL/이미지 | manual provider 로 후보에 합류 (아래 2단계) |

먼저 `design/design-profile.json` 을 **Read** 한다. 여기서 추출하는 탐색 변수:

- `visual_tone`, `brand_impression`(우선순위), `information_density.level` → 검색 키워드 시드
- `typography.direction`, `color.direction` / `color.avoid` → Visual Style 축 필터
- `layout.navigation`, `layout.content_width`, `layout.spacing` → UX Pattern 축 필터
- `avoid`(금지 요소) → 후보 제외 기준 + 각 후보의 `doNotApply` 시드
- `weighting`(product/taste/brand) → 점수 종합 시 가중치

`references/reference-taxonomy.md` 와 `providers/README.md` 를 **Read** 해 분류 축과 provider 우선순위를 확인한 뒤 진행한다.

---

## 단계

### 0단계 — 선행 산출물 확인 + 제품 유형 확정

1. `design/design-profile.json` 존재 확인. 없으면 위 "입력" 표대로 처리.
2. 제품 유형을 확정한다(검색 키워드와 비교 화면 세트를 좌우한다). 프로필에서 추론하되 모호하면 **AskUserQuestion** 으로 묻는다:
   - `crm` / `content` / `commerce` / `admin` / `mobile` / 기타
   - 이 유형은 `/design-compare` 의 대표 화면 세트와 연결된다(CONTRACT §13: SaaS=대시보드/목록/상세/폼, 콘텐츠=홈/목록/상세/검색, 커머스=상품목록/상세/장바구니/주문, 모바일=홈/기능/상세/설정).

### 1단계 — 2축 분리 탐색 (Visual Style 검색 ⟂ UX Pattern 검색)

**핵심 규칙(CONTRACT §11): 한 서비스를 통째로 복제하지 않는다. 시각 스타일과 UX 구조를 서로 다른 레퍼런스에서 가져온다.** 그래서 검색을 두 갈래로 분리한다.

**(A) Visual Style 검색** — 색상·타이포·표면 질감·여백·모서리·아이콘·이미지 스타일·분위기.
- 검색어 시드: `visual_tone` + `brand_impression` 상위 2개 + "디자인 시스템/스타일 가이드/landing/UI" 류 표현.
- 예: 프로필이 `restrained, editorial, warm-neutral` 라면 → "editorial restrained SaaS interface", "warm neutral product UI design system", "low-decoration high-legibility dashboard".
- `color.avoid` / `avoid` 에 든 표현(예: decorative-gradients, glassmorphism)은 **검색에서 배제**하거나 명시적으로 "no gradient / flat" 류로 좁힌다.

**(B) UX Pattern 검색** — 내비게이션·정보구조·검색·필터·목록/테이블·상세·폼·편집기·온보딩·빈/오류 상태·반복 업무 흐름.
- 검색어 시드: 제품 유형 + `layout.navigation` + `information_density.level` + 핵심 업무 키워드.
- 예: `admin` + `persistent-left-sidebar` + `high` → "data-dense admin table UX", "left sidebar filter list detail pattern", "bulk action workflow admin".

각 축에서 **후보군을 넓게 모은 뒤** 좁힌다. 도구:
- `WebSearch` 로 후보 서비스/페이지를 찾고, `WebFetch` 로 각 페이지를 읽어 색/타이포/레이아웃 단서를 **본문 근거로** 확보한다(인상만으로 단정 금지 — 근거를 `source.url` 로 남긴다).
- 검색은 **2축을 섞지 않는다**. Visual 검색 결과에서 UX 구조를 끌어오지 않고, UX 검색 결과에서 색감을 흉내내지 않는다. 조합은 후보 메타데이터의 `category`(`visual-style` / `ux-pattern` / `hybrid`)로 표시한다.

### 2단계 — Provider 선택 (graceful)

탐색 소스는 다음 **우선순위**를 따른다(CONTRACT §12, `providers/README.md`). 기본은 WebSearch/WebFetch 이며, 상위 provider 가 가용하면 그쪽을 우선한다.

| 순위 | Provider | 사용 조건 | 가용성 |
|------|----------|-----------|--------|
| 1 | 공식 MCP (예: Stitch `mcp__stitch__*`) | MCP 가 환경에 연결돼 있을 때만 | **옵션** — 없으면 조용히 건너뛴다 |
| 2 | 브라우저 자동화 (Chrome MCP 등) | 동적 페이지 캡처가 필요하고 가용할 때 | 옵션 |
| 3 | 사용자 제공 URL | 사용자가 레퍼런스 URL 을 줬을 때 (manual provider) | 항상 |
| 4 | 사용자 제공 이미지 | 사용자가 이미지를 줬을 때 (manual provider) | 항상 |
| 5 | 수동 등록 / WebSearch·WebFetch | **기본 경로** | 항상 |

- **Stitch MCP 가용 시(옵션)**: `mcp__stitch__generate_screen_from_text` / `generate_variants` 로 후보 스타일의 화면 변형을 만들어 시각 비교 자료로 보탤 수 있다. 단, 이는 *레퍼런스 보강*이지 *대체*가 아니다 — 실제 존재하는 서비스 근거(`source.url`)를 우선한다. MCP 가 없으면 이 옵션을 언급만 하고 **WebSearch/WebFetch 로 진행**한다(에러 없이 fallback).
- 환상 API 호출을 지어내지 않는다. 연결되지 않은 도구는 호출하지 않는다.
- 사용자가 URL/이미지를 줬다면 manual provider 로 후보 목록에 합류시키되, **다양성 규칙은 동일 적용**한다.

### 3단계 — 후보 평가 (9개 기준)

수집한 후보마다 다음 **9개 기준**(CONTRACT §11)으로 평가한다. 각 기준은 한 줄 근거를 남긴다.

| # | 기준 | 확인 질문 |
|---|------|-----------|
| 1 | 제품 적합성 | 이 디자인이 *이 제품의 목적*에 맞나? (마케팅 톤을 업무 도구에 끼우지 않았나) |
| 2 | 사용자 적합성 | 실제 사용자(연령·숙련도·사용 맥락)에 맞나? |
| 3 | 핵심 업무 적합성 | 가장 자주 하는 작업을 이 구조가 빠르게 돕나? |
| 4 | 정보 밀도 적합성 | 프로필 `information_density.level` 과 맞나? (과밀/과소 아님) |
| 5 | 브랜드 인상 적합성 | `brand_impression` 우선순위와 일치하나? |
| 6 | 구현 가능성 | CSS Variables + Tailwind 로 무리 없이 구현되나? (복잡 3D·고급 모션 의존 아님) |
| 7 | 반응형 적용 가능성 | 모바일에서 재배치 가능한 구조인가? (단순 축소 강요 아님) |
| 8 | 접근성 | 색 의존 상태표시·낮은 대비·포커스 부재 같은 구조적 결함이 없나? |
| 9 | 기존 후보와의 차별성 | 이미 모은 후보와 **시각적으로 충분히 다른가?** |

이 9기준을 `references.json` 의 `scores` 5개 축으로 압축한다(0~100):
`productFit`(1·3 종합) / `brandFit`(5) / `uxFit`(2·4·7 종합) / `distinctiveness`(9) / `implementation`(6·8 종합).
점수 종합 시 프로필 `weighting`(product/taste/brand)을 가이드로 쓰되, 점수는 **근거 기반**이어야 한다(가짜 정밀도 금지 — 5·10 단위 반올림 권장).

### 4단계 — 후보 좁히기 (개수 + 다양성 규칙)

- **개수**: 기본 5개. 최소 3 / 최대 7. (`references.json` 에 담는 후보 수)
- **사용자에게 제안**: 3~5개로 추린다(너무 많으면 비교가 흐려진다).
- **다양성 규칙(필수)**: 후보들은 서로 **시각적으로 구별**돼야 한다. 같은 톤·같은 구조의 변형 5개는 실패다. 서로 다른 방향을 의도적으로 배치한다. 예시 좌표축:

  | 후보 예시명 | 시각 방향 | 의도된 차이 |
  |-------------|-----------|-------------|
  | Warm Editorial | 따뜻한 중립 + serif display | 읽기 흐름·여백 |
  | Compact Productivity | 조밀·테이블 우선·저장식 | 정보 밀도·반복 업무 |
  | Minimal Monochrome | 무채색·1 accent·저장식 | 절제·집중 |
  | Friendly Consumer | 부드러운 곡률·따뜻한 accent | 친근함·접근성 |
  | Technical Industrial | mono·격자·강한 위계 | 기술적 신뢰·정밀 |

  (이름은 프로젝트에 맞게 새로 짓는다 — 위는 *서로 다름의 거리* 를 보여주는 예일 뿐, 그대로 박지 않는다.)

- **금지**: 유명 서비스만 추천(Stripe/Linear/Notion 같은 흔한 디폴트만 나열) 금지. 특정 서비스 통째 복제 권유 금지(CONTRACT §18). 적어도 **2개 이상의 근거 소스**를 검토한 흔적을 남긴다.

### 5단계 — 스크린샷 캡처 (가능 범위)

`design/research/screenshots/` 에 후보별 캡처를 저장한다.

- 브라우저 자동화/Chrome MCP 가 가용하면 후보의 대표 화면을 캡처한다(파일명: `{candidate-id}-{n}.png`, 예 `candidate-a-1.png`).
- 사용자가 이미지를 줬다면 그 파일을 이 폴더로 복사/배치한다.
- **캡처 수단이 없으면**: 디렉토리만 만들고, `references.json` 의 `screenshots` 는 빈 배열로 두되 `REFERENCE-REPORT.md` 에 "캡처 미수행 — 출처 URL 로 확인" 을 명시한다. 가짜 경로를 넣지 않는다.
- 출처의 로고/고유 일러스트/카피를 산출물에 복제하지 않는다(CONTRACT §18). 캡처는 *근거 보기용* 이며 그대로 디자인에 옮기지 않는다.

폴더 생성:
```bash
mkdir -p design/research/screenshots
```

### 6단계 — 산출물 작성

아래 2개 파일을 작성한다(경로 절대 고정).

#### (1) `design/research/references.json`

CONTRACT §4.2 `references.schema.json` 을 **정확히** 따른다. `id` 는 `candidate-a`..`candidate-g`.

```jsonc
{
  "project": "<프로필의 project>",
  "generatedAt": "<ISO date-time>",
  "candidates": [
    {
      "id": "candidate-a",
      "name": "Warm Editorial",
      "source": { "name": "<실제 서비스/페이지 이름>", "url": "https://..." },
      "category": "visual-style",                 // visual-style | ux-pattern | hybrid
      "keywords": ["editorial", "warm-neutral", "serif-display", "low-decoration"],
      "recommendedFor": ["오래 보는 읽기 흐름", "신뢰·전문성 인상"],
      "strengths": ["높은 가독성", "절제된 장식", "강한 타이포 위계"],
      "risks": ["조밀한 데이터 화면엔 여백 과다 위험"],
      "apply": ["serif display + humanist body 페어", "warm-neutral 표면", "1px border 구분"],
      "doNotApply": ["마케팅용 대형 히어로", "장식용 그라데이션"],
      "expectedImpression": "차분하고 신뢰감 있는 편집물 같은 인상",
      "screenshots": ["screenshots/candidate-a-1.png"],   // research/ 기준 상대경로, 없으면 []
      "scores": { "productFit": 90, "brandFit": 85, "uxFit": 70, "distinctiveness": 85, "implementation": 80 }
    }
    // ... 총 3~7개
  ]
}
```

작성 규칙:
- `apply` / `doNotApply` 는 **반드시 채운다** — "이 레퍼런스에서 무엇을 가져오고 무엇을 버리는가"가 이 단계의 핵심 산출이다(원칙 5: 조합 선택의 재료).
- `screenshots` 경로는 `research/` 기준 상대경로(`screenshots/...`). 실제 파일이 없으면 `[]`.
- `category` 로 2축 출처를 표시한다(Visual 검색 산출은 `visual-style`, UX 검색 산출은 `ux-pattern`, 둘 다면 `hybrid`).
- `keywords`·`source.url` 은 비우지 않는다(역추적성).

#### (2) `design/research/REFERENCE-REPORT.md`

사람이 읽는 비교 보고서. 후보를 *판단*할 수 있게 쓴다. 권장 구조:

```markdown
# 디자인 레퍼런스 리포트 — <project>

## 요약
- 제품 유형: <crm/...>  | 정보 밀도: <level>  | 핵심 인상: <상위 2>
- 탐색 축: Visual Style <n>건 / UX Pattern <m>건
- 제안 후보: <3~5>개 (서로 시각적으로 구별됨)

## 후보 비교표
| 후보 | 한 줄 인상 | 시각 방향 | UX 방향 | 추천 점수(가중) |
|------|-----------|----------|---------|------------------|
| A Warm Editorial | ... | serif+warm | 읽기 흐름 | 84 |
| ...

## 후보별 상세
### A — Warm Editorial  (category: visual-style)
- **키워드**: ...
- **추천 이유**: ...
- **적용할 요소(apply)**: ...
- **적용하지 않을 요소(doNotApply)**: ...
- **장점 / 위험**: ...
- **예상 인상**: ...
- **출처**: <name> — <url>
- **점수**: Visual <…> · UX <…> · 종합 <…>
( B, C, … 동일 구조 )

## 조합 제안 (원칙 5)
- 예: A 의 타이포 + B 의 테이블/필터 UX + C 의 색상 절제
- 왜 이 조합인가: <제품 목적·사용자 행동 근거>

## 검토한 출처
- 최소 2개 이상. 채택/탈락 이유 1줄.

## 다음 단계
- `/design-compare` — 위 후보를 **동일 콘텐츠로 디자인만 바꿔** 나란히 본다.
```

---

## 산출물 경로 (절대 고정 — CONTRACT §3)

```
design/research/
├── REFERENCE-REPORT.md      # 사람이 읽는 비교 보고서
├── references.json          # Reference Candidate[] (schema §4.2)
└── screenshots/             # 캡처 png (없으면 빈 폴더 + 리포트에 명시)
```

---

## 품질 체크 (저장 전)

- [ ] `references.json` 이 `schemas/references.schema.json` 형태와 정확히 일치(필드명·`id` 패턴 `candidate-a..g`·`scores` 5축).
- [ ] 후보 수 3~7개(기본 5), 사용자 제안은 3~5개.
- [ ] **다양성**: 후보들이 서로 시각적으로 구별된다(같은 톤·구조 변형 나열 아님).
- [ ] **2축 분리**: 시각 스타일과 UX 구조를 같은 레퍼런스에서 뭉뚱그리지 않았다(`category` 표시).
- [ ] 각 후보 `apply` / `doNotApply` 가 채워져 있다(가져올 것/버릴 것 분리).
- [ ] 모든 후보에 `source.url` 근거가 있고, 최소 2개 출처를 검토했다.
- [ ] 유명 서비스만 나열하지 않았고, 특정 서비스 통째 복제를 권하지 않았다.
- [ ] 9개 평가 기준이 점수 근거로 반영됐다(가짜 정밀도 없음 — 근거 기반).
- [ ] 자기 문서의 예시에도 진부한 AI 기본값(순수 #000/#fff, Tailwind 기본 보라/파랑, 이모지 장식, 가짜 수치)을 쓰지 않았다.
- [ ] 단계를 건너뛰거나 사용자 선택 없이 후보를 자동 확정하지 않았다("생성보다 판단").

---

## 다음 단계

`/design-compare` — `design/research/references.json` 을 입력으로, **모든 후보가 동일 콘텐츠**(`design/compare/data/content.json`)를 쓰고 **디자인만**(`design/compare/data/candidates.json` 토큰) 다른 비교 UI(React/Vite)를 생성한다. 사용자는 거기서 요소 단위로 좋아요/싫어요를 고른다.

> 후보가 정해졌다고 디자인이 정해진 게 아니다. 이 리포트는 **사용자가 보고 고를** 선택지다.
> 사용자가 무엇을 좋아하고 싫어하는지, 왜인지를 확인하기 전까지 시스템 단계로 넘어가지 않는다.
