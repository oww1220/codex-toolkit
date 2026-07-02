---
name: design-compare
description: 동일 콘텐츠·다른 디자인의 후보들을 사용자가 직접 보고 비교·선택하는 React/Vite 비교 앱을 design/compare/ 에 생성하는 디자인 파이프라인 4단계. 트리거 — "디자인 비교", "후보 비교 앱", "디자인 골라줘", "나란히 비교", "/design-compare".
allowed-tools: Read, Write, Bash
---

# /design-compare — 동일 콘텐츠 후보 비교 앱 생성

> AI Design Director 9단계 파이프라인의 **4단계**. 앞서 탐색한 레퍼런스 후보들을
> *말이 아니라 화면으로* 비교하게 한다. 모든 후보는 **같은 콘텐츠·같은 화면**을 쓰고
> **디자인(토큰)만** 다르다. 사용자는 후보를 보고, 요소별로 좋아요/싫어요를 누르고,
> 단일 또는 조합으로 선택한 결과를 `design/compare/selection.json` 으로 내보낸다.

## 정신 (BUILD CONTRACT §0 6원칙)

- **말보다 선택을 신뢰**: "미니멀하게" 같은 표현으로 결정하지 않는다. 후보를 *실제로 보여주고* 무엇이 좋은지/싫은지/왜인지 클릭으로 받는다.
- **동일 조건 비교 (불변식)**: 후보마다 화면 구조·데이터·문장이 **완전히 같아야** 한다. 콘텐츠가 후보마다 달라지면 비교가 무의미해지고 이 단계는 **실패**다. 오직 디자인 토큰만 다르다.
- **단일 또는 조합 선택**: 후보 A 전체를 고르거나, A의 타이포 + B의 정보구조 + C의 색상처럼 요소 단위로 섞을 수 있어야 한다.
- **시각 스타일 ↔ UX 구조 분리**: 비교 앱은 색·타이포뿐 아니라 내비게이션·밀도·테이블/카드 같은 구조 차이도 같은 화면 위에서 드러낸다.
- **이 단계는 코드를 만들지만, 디자인을 *확정하지 않는다***. 확정은 다음 단계(`/design-select`)의 몫. 여기서는 사용자가 *판단할 무대*를 만든다.

> **🚫 NO-SKIP 게이트 2 (위반 = 빵점 · SKILL.md/CONTRACT §2 와 동기화)**: 후보 비교는 **반드시 실제로 렌더링되는 HTML/웹 화면**으로 보여주고 고르게 한다.
> `AskUserQuestion` 의 텍스트·ASCII preview 로 시각 비교를 **대체 금지** — 그건 방향·속성 질문(톤·용도·밀도 등) 전용이다.
> 화면 없이 "후보 비교했다" 하면 빵점. 풀 React 앱이 과한 산출물(표지·포스터 등)이면 **간이 1장 HTML 미리보기라도 *실제 픽셀*** 로 보여준다.

---

## 1. 목적

| 항목 | 내용 |
|------|------|
| **입력** | `design/research/references.json` (후보 3~7개) · `design/design-profile.json` (프로젝트 디자인 프로필) · (선택) `design/research/screenshots/` |
| **출력** | `design/compare/` — 빌드 가능한 React/Vite/TypeScript 비교 앱. 핵심: `design/compare/data/content.json`(공통 콘텐츠), `design/compare/data/candidates.json`(후보별 토큰), `design/compare/selection.json`(사용자 선택 export) |
| **선행 단계** | `/design-research` (references.json) — 없으면 먼저 권한다 |
| **다음 단계** | `/design-select` (selection.json → 합성된 디자인 방향) |

이 단계의 성공 기준: 사용자가 `npm run dev` 로 앱을 열어 후보를 **나란히 보고**, 요소별 선호를
누르고, 선택을 `selection.json` 으로 내보낼 수 있어야 한다. 그리고 그 모든 후보가
**한 글자도 다르지 않은 동일 콘텐츠**를 보여줘야 한다.

---

## 2. 선행 산출물 확인 (시작 전 게이트)

질문·생성 전에 먼저 입력의 존재를 확인한다.

1. `design/research/references.json` 이 있는가 → `Read` 로 후보 배열(`candidates[]`)을 읽는다.
   - **없으면**: 사용자에게 알리고 `/design-research` 를 먼저 돌리도록 권한다. (임의로 후보를 지어내지 않는다.)
   - 후보가 3개 미만이면 비교 의미가 약하다 — `/design-research` 로 후보를 더 확보하도록 권한다.
2. `design/design-profile.json` 이 있는가 → `Read`. 프로젝트의 visual_tone·information_density·navigation·avoid 등을 후보 토큰 시드의 기준값으로 쓴다. (없어도 진행 가능하나, 있으면 후보 간 *공통 베이스라인*을 잡는 데 쓴다.)
3. (선택) `design/research/screenshots/` 의 캡처가 있으면 후보 패널의 "추천 이유" 옆에 참조로 노출할 수 있다(있는 만큼).

> 이 스킬의 핵심은 *판단의 무대 만들기*다. 선행 산출물이 없을 때 단계를 건너뛰고 후보를
> 임의 생성하면 6원칙(말보다 선택을 신뢰)에 어긋난다. 반드시 선행 단계로 되돌린다.

---

## 3. 단계별 플레이북

### Step 1 — 비교 데이터 시드 (references.json → content.json + candidates.json)

`design/research/references.json` 의 각 후보를 **비교 앱이 읽을 두 데이터 파일**로 변환한다.
가능하면 `scripts/create-comparison.ts` 를 사용한다 — 없거나 환경이 안 되면 아래 로직을 직접 수행한다.

```bash
# 시드 스크립트(존재 시): references.json → design/compare/data/{content.json, candidates.json}
#                         + compare-ui 스캐폴드를 design/compare/ 로 복사
npx tsx scripts/create-comparison.ts --project <프로젝트명>
```

#### (A) `design/compare/data/content.json` — 모든 후보 공통 콘텐츠 (불변식의 핵심)

- 대표 화면들에 들어갈 **모든 텍스트·숫자·데이터**를 한 곳에 둔다. 화면 컴포넌트는 이 파일에서만 내용을 읽는다.
- **후보가 달라져도 이 파일은 절대 갈라지지 않는다.** content.json 은 후보와 무관한 *단일 콘텐츠 소스*다.
- 가짜 수치(99% / 10x / 100%) 대신, 제품 유형에 맞는 **그럴듯한 실데이터 형태**(고객명·금액·날짜·상태 라벨 등)를 둔다. 데이터가 비어 보이면 차라리 정직한 placeholder("샘플 고객 12명")를 쓴다.

#### (B) `design/compare/data/candidates.json` — 후보별 토큰/스타일 (디자인만 다름)

- references.json 의 `candidates[].id`(candidate-a..g) 를 그대로 키로 쓴다. id·name 은 references.json 과 **정합**해야 한다.
- 각 후보마다 **디자인 토큰 묶음만** 담는다 — 색상(background/surface/text/border/accent/semantic), 타이포(display/body 폰트, size/weight), spacing, radius, shadow, navigation 형태, density 등. (토큰 그룹 표준은 BUILD CONTRACT §5.)
- 후보 토큰은 references.json 의 `apply`/`expectedImpression`/`keywords` 와 design-profile 의 방향에서 **추정**해 시드한다. 캡처가 있으면 색·모서리 관찰을 반영한다.
- 후보별 `description`(어떤 인상인지)·`recommendedFor`(어디에 맞는지)·`risks`(주의점)를 함께 담아 비교 앱의 설명 패널에 노출한다.

> **AI slop 자가검열 (시드 토큰을 만들 때도 적용)**: 순수 `#000`/`#fff` 금지(accent 톤을 살짝 띤 off-black/off-white). Tailwind 기본 blue/violet 그대로 박지 않기. 의미 없는 보라/파랑 그라데이션 금지. 이모지 장식 금지. 후보들은 *서로 충분히 구별*돼야 한다 — 예: Warm Editorial / Compact Productivity / Minimal Monochrome / Friendly Consumer / Technical Industrial. 모두 비슷한 톤이면 비교가 무의미하다.

#### 데이터 정합 자가검증
- [ ] `candidates.json` 의 후보 id·name 이 `references.json` 과 일치한다.
- [ ] 모든 대표 화면이 `content.json` *한 곳*에서만 내용을 읽는다(후보별 콘텐츠 분기 없음).
- [ ] candidates.json 에는 **토큰/스타일만** 있고 콘텐츠 문장이 섞이지 않았다.

---

### Step 2 — compare-ui 스캐폴드를 `design/compare/` 로 복사

이 스킬 레포의 `compare-ui/` 스캐폴드(빌드 가능한 React/Vite/TypeScript 최소 동작본)를
사용자 프로젝트의 `design/compare/` 로 복사한다. 그 위에 Step 1 에서 만든 데이터 파일을 얹는다.

```bash
# 1) compare-ui 스캐폴드를 사용자 프로젝트 design/compare/ 로 복사
#    (scripts/create-comparison.ts 가 이 복사까지 수행하면 이 단계는 생략)
mkdir -p design/compare
cp -R compare-ui/. design/compare/

# 2) Step 1 에서 시드한 데이터를 스캐폴드의 public/data 로 배치
mkdir -p design/compare/data design/compare/public/data
# content.json / candidates.json 은 design/compare/data 에 두고,
# 앱이 fetch 하도록 public/data 에도 동일 사본을 둔다(스캐폴드 규약에 맞춤).
cp design/compare/data/content.json    design/compare/public/data/content.json
cp design/compare/data/candidates.json design/compare/public/data/candidates.json
```

스캐폴드가 제공하는 구조(참고 — BUILD CONTRACT §13):

```
design/compare/
├── package.json  vite.config.ts  tsconfig.json  index.html  README.md
├── public/data/{content.json, candidates.json}   # 앱이 fetch 하는 데이터
├── data/{content.json, candidates.json}          # 시드 원본(단일 소스)
├── selection.json                                 # 사용자 선택 export 결과(앱이 다운로드)
└── src/
    ├── main.tsx  App.tsx  index.css
    ├── theme.ts        # candidates.json 토큰 → CSS variables 주입
    ├── store.ts        # 선택 상태 + LocalStorage + export
    ├── types.ts        # Content/Candidate/Selection 타입(스키마와 정합)
    ├── components/     # Toolbar, CandidateTabs, ViewportFrame, SelectionPanel, ElementPicker, SideBySide ...
    └── screens/        # 대표 화면 컴포넌트(토큰만 갈아끼우면 모든 후보 표현)
```

> 스캐폴드의 화면 컴포넌트는 **토큰만 바꿔 끼우면 모든 후보를 표현**하도록 설계돼 있다.
> 후보별로 화면 컴포넌트를 따로 복제하지 않는다 — 그렇게 하면 콘텐츠가 갈라질 위험이 생기고
> 동일 조건 비교 불변식이 깨진다.

---

### Step 3 — 대표 화면을 제품 유형에 맞게 선정 (BUILD CONTRACT §13)

비교는 **추상적 컴포넌트 갤러리가 아니라 실제 제품 화면** 위에서 이뤄져야 의미가 있다.
`design/design-profile.json` 과 `design/DESIGN-BRIEF.md`(있으면)에서 제품 유형을 판단해
대표 화면 4종을 고른다. 화면 *내용*은 `content.json` 에서 오고, 후보는 토큰만 바꾼다.

| 제품 유형 | 대표 화면 4종 |
|-----------|--------------|
| SaaS / 업무 도구 | 대시보드 · 목록(테이블) · 상세 · 폼 |
| 콘텐츠 / 미디어 | 홈 · 목록 · 상세(읽기) · 검색 |
| 커머스 | 상품 목록 · 상품 상세 · 장바구니 · 주문 |
| 모바일 앱 | 홈 · 기능 · 상세 · 설정 |

> 화면 선정은 **밀도·테이블 vs 카드·내비게이션 구조**가 후보 간에 어떻게 갈리는지가
> 가장 잘 드러나는 화면을 고르는 것이 핵심이다. 마케팅 랜딩 한 장만 비교하지 않는다
> (업무용 SaaS에 마케팅 패턴을 끌어오는 혼동을 피한다 — Gate 1 Product Fit).

선정한 화면 목록과 *왜 그 화면들인지*를 `design/compare/README.md` 에 1~2줄로 기록한다.

---

### Step 4 — 빌드 검증 후 구동 안내

스캐폴드는 **실제로 빌드되는 최소 동작본**이어야 한다. 의존성 설치 후 타입·빌드를 검증한 뒤
사용자에게 구동 방법을 안내한다.

```bash
# design/compare 안에서 의존성 설치 + 빌드 검증(타입 정합 확인)
npm --prefix design/compare install
npm --prefix design/compare run build   # 타입 오류·번들 실패가 없는지 확인

# 사용자 구동 안내(개발 서버)
npm --prefix design/compare run dev      # → http://localhost:5173 (Vite 기본)
```

> `npm run build` 가 실패하면(타입 불일치·데이터 형태 오류 등) **사용자에게 dev 를 안내하기 전에**
> 원인을 고친다. 대개 `candidates.json`/`content.json` 의 형태가 `src/types.ts` 와 어긋난 경우다.
> 데이터를 types 에 맞추거나(권장), 누락 토큰을 채운다.

---

## 4. 비교 앱 기능 (BUILD CONTRACT §13 — 스캐폴드가 제공)

생성된 앱이 갖춰야 하는 기능. (구현은 `compare-ui/` 스캐폴드에 있고, 이 커맨드는 데이터·화면을 채운다.)

| 기능 | 설명 |
|------|------|
| **후보 전환** | 후보 A/B/C/D/E 탭 전환 · **나란히 보기(side-by-side)** · 같은 화면 빠른 전환 |
| **뷰포트** | desktop / tablet / mobile 전환 (반응형 차이를 같은 화면에서 확인) |
| **테마** | 라이트 / 다크 토글 |
| **전체화면** | 한 후보를 풀스크린으로 몰입 검토 |
| **설명 패널** | 후보별 설명 · 추천 이유(recommendedFor) · 주의점(risks) |
| **요소 선호** | 요소 **15종** 각각 좋아요/싫어요 + 메모 |
| **선택 방식** | 단일 후보 전체 선택 **또는** 요소 단위 조합 선택 |
| **저장·내보내기** | LocalStorage 자동 저장 + `selection.json` **export(다운로드 버튼)** |

요소 단위 선택 **15종 (고정 — `schemas/selection.schema.json` 과 정합)**:
`color, typography, navigation, density, buttons, forms, cards, tables, modals, icons, spacing, radius, shadow, images, motion`.

export 결과 `design/compare/selection.json` 의 형태는 `schemas/selection.schema.json` 을 따른다
(요지):

```jsonc
{
  "selectedCandidate": "candidate-a | ... | null",   // 단일 선택 시 후보 id, 조합이면 null
  "combinedSelection": {                              // 요소 단위 조합(일부만 채워도 됨)
    "color": "candidate-a", "typography": "candidate-a",
    "navigation": "candidate-b", "tables": "candidate-b", "icons": "candidate-d"
  },
  "likes":    [ { "candidate": "candidate-a", "element": "typography", "note": "본문이 오래 읽어도 편함" } ],
  "dislikes": [ { "candidate": "candidate-c", "element": "color", "note": "강조색이 너무 튐" } ],
  "notes": "전반적으로 절제된 쪽 선호.",
  "approvedAt": ""                                     // 아직 미확정이면 빈 문자열 — 확정은 /design-select
}
```

> `approvedAt` 은 이 단계에서는 **빈 문자열**로 둔다. 사용자 승인 없이 자동 확정하지 않는다.
> 확정(approvedAt 채움)은 다음 단계 `/design-select` 가 `design/selection.json` 으로 승격할 때 일어난다.

---

## 5. 비교 페이지 자체의 디자인 규약 (자기 적용)

이 비교 앱 **자체도** AI slop 회귀를 막는 것이 상품이므로, 비교 앱 UI도 진부하지 않고 반응형이어야 한다.

- 반응형: 비교 앱 자체가 desktop/tablet/mobile 에서 무너지지 않는다(도구 UI와 *미리보기 프레임*은 별개).
- 순수 `#000`/`#fff` 금지 — 도구 셸도 살짝 톤 띤 중성색. Tailwind 기본 blue/violet 그대로 금지.
- 이모지 장식·의미 없는 그라데이션·균등 카드 그리드 금지. 후보 패널은 *정보 위계*가 보이게(주: 미리보기 / 부: 설명·선호).
- 단, 비교 앱의 셸 디자인이 후보 *미리보기 영역*의 인상을 오염시키면 안 된다 — 미리보기 프레임은 중립적이고, 셸의 색·강조가 후보 화면 안으로 새지 않도록 격리한다.

---

## 6. 산출물 경로 (BUILD CONTRACT §3 — 절대 고정)

| 파일/폴더 | 경로 |
|-----------|------|
| 비교 앱(전체) | `design/compare/` |
| 공통 콘텐츠 | `design/compare/data/content.json` |
| 후보별 토큰 | `design/compare/data/candidates.json` |
| 사용자 선택 export | `design/compare/selection.json` |
| 앱 데이터(fetch용) | `design/compare/public/data/{content.json, candidates.json}` |

참조하는 입력 경로: `design/research/references.json`, `design/design-profile.json`,
(선택) `design/research/screenshots/`. 스캐폴드 출처: 이 스킬 레포의 `compare-ui/`. 시드 스크립트: `scripts/create-comparison.ts`.

---

## 7. 품질 체크 (생성 직후 자가검증)

- [ ] **동일 조건 비교 불변식**: 모든 후보가 `design/compare/data/content.json` 한 곳의 콘텐츠를 쓰고, 후보별로 문장·데이터가 갈라지지 않는다. (이게 깨지면 이 단계는 **실패**.)
- [ ] `candidates.json` 의 후보 id·name 이 `design/research/references.json` 과 정합한다.
- [ ] `candidates.json` 에는 **토큰/스타일만** 있고 콘텐츠가 섞이지 않았다.
- [ ] 대표 화면 4종이 제품 유형에 맞게 선정됐고 `design/compare/README.md` 에 근거가 적혔다.
- [ ] 요소 선호 **15종**이 모두 노출되며 `schemas/selection.schema.json` enum 과 일치한다.
- [ ] `npm --prefix design/compare run build` 가 성공한다(타입 정합·번들 OK).
- [ ] export 한 `selection.json` 이 `schemas/selection.schema.json` 형태를 만족하고 `approvedAt` 이 빈 문자열이다.
- [ ] 비교 앱 자체가 반응형이고 AI slop(순수 `#000/#fff`·기본 blue/violet·이모지 장식·의미 없는 그라데이션·균등 카드 그리드)을 피했다(BUILD CONTRACT §1 자가검열).
- [ ] 후보들이 *서로 충분히 시각적으로 구별*된다(모두 비슷한 톤이면 비교 무의미 — `/design-research` 로 후보 다양성 보강 권유).

---

## 8. 다음 단계 안내

빌드 검증 + 구동 안내 후 사용자에게 알린다:

> `design/compare/` 비교 앱이 준비됐습니다. `npm --prefix design/compare install && npm --prefix design/compare run dev`
> 로 열어 후보를 **나란히 보고**, 요소별로 좋아요/싫어요를 누른 뒤, **선택 내보내기** 버튼으로
> `design/compare/selection.json` 을 저장하세요. 그 다음 **`/design-select`** 가 이 선택을 합성해
> 최종 디자인 방향(`design/DESIGN-DIRECTION.md`)과 확정 선택(`design/selection.json`)을 만듭니다.

`design-select` 는 `design/compare/selection.json` 을 입력으로 읽으므로, 다음 단계 진입 전
사용자가 **export 를 실제로 했는지**(파일이 존재하고 비어 있지 않은지) 확인한다.

---

## 참고 — 이전 단계 산출물 부재 처리

- `design/research/references.json` 이 없으면 → `/design-research` 를 먼저 권한다. 후보를 임의 생성하지 않는다.
- 후보가 3개 미만이면 → 비교의 의미가 약하므로 `/design-research` 로 후보를 더 확보하도록 권한다.
- Node/npm 환경이 없어 `npm install`/`build` 가 불가하면 → 데이터·스캐폴드는 그대로 생성하되, 사용자가 직접 `npm install && npm run dev` 하도록 명확히 안내하고 그 사실을 보고한다(환상 실행 결과를 지어내지 않는다).
- `/design-full` 오케스트레이션은 이 단계의 선행 순서(브리프→번역→리서치→비교)를 보장하며, 선택 게이트를 자동으로 건너뛰지 않는다.
