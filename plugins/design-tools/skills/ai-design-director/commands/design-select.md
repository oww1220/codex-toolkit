---
name: design-select
description: 비교 UI에서 사용자가 내린 요소 단위 선택(좋아요/싫어요·단일/조합)을 하나의 일관된 디자인 방향으로 합성한다. 충돌을 명시 해결하고 모든 요소에 출처·근거를 붙인다. design/compare/selection.json 을 입력으로 받아 DESIGN-DIRECTION.md + selection.json + DECISION-LOG.md 를 산출. 트리거 — "선택 합성해줘", "고른 거 정리해줘", "디자인 방향 확정", "/design-select".
allowed-tools: Read, Write, AskUserQuestion
---

# /design-select — 사용자 선택 합성

9단계 파이프라인의 5번째 단계. `/design-research`(후보) → `/design-compare`(비교) 에서
사용자가 **본 것을 고른 결과**(`design/compare/selection.json`)를 받아, 흩어진 선택을
**하나의 일관된 디자인 방향**으로 합성한다. 이 단계는 디자인을 *만들지* 않는다 —
사용자의 판단을 *정리하고 충돌을 해결*한다.

> 이 단계의 산출은 픽셀이 아니라 **방향과 그 근거**다. 모든 요소에 *어느 후보에서 왔는가(출처)*
> 와 *왜 이 선택인가(근거)* 를 붙인다. 근거를 못 쓰는 요소는 채택하지 않는다(6원칙 #6:
> "모든 결정엔 이유"). hex 같은 실제 토큰 값은 여기서 확정하지 않는다 — 그건 `/design-system` 의 몫이다.

---

## 목적

- `design/compare/selection.json` 의 단편적 선택(요소별 좋아요/싫어요, 단일 또는 조합)을
  **일관된 한 방향**으로 종합한다.
- 조합 선택이 낳는 **후보 간 전제 충돌**(예: A 색상은 다크 표면 전제, B 레이아웃은 밝은 표면+강한 보더 전제)을
  **명시적으로** 드러내고 해결한다 — 슬그머니 한쪽을 버리지 않는다.
- 모든 채택 요소에 **출처 후보 + 근거**를 부착한다(제품 목적·사용자 행동·인상과 연결).
- 사용자가 **제품에 부적합한 선택**을 했더라도 막지 않되, *위험을 설명*하고 취향/제품적합 두 대안을 제시한 뒤
  **최종 결정은 사용자**에게 맡긴다(6원칙 #2: "말보다 선택을 신뢰", 단 §17 가중치를 고지).
- 다음 단계(`/design-system`)가 바로 토큰화할 수 있도록 **인계 사항**을 추린다.

---

## 입력

| 입력 | 경로 | 없을 때 |
|------|------|---------|
| 사용자 선택 (필수) | `design/compare/selection.json` | 아래 "0단계" 로 처리 — `/design-compare` 를 먼저 돌리도록 안내하거나, 사용자에게 AskUserQuestion 으로 직접 선택을 받아 최소 selection 구성 |
| 후보 정의 (필수) | `design/research/references.json` | `/design-research` 를 먼저 돌리도록 안내. 출처 후보의 `apply`/`doNotApply`/`name` 을 근거로 쓴다 |
| 디자인 프로필 (필수) | `design/design-profile.json` | `/design-translate` 를 먼저 돌리도록 안내. `weighting`·`avoid`·`brand_impression` 이 부적합 판단·근거의 기준 |
| 디자인 브리프 (참고) | `design/DESIGN-BRIEF.md` | 없어도 진행 (프로필에 요약돼 있음) |

먼저 위 3개 필수 입력을 **Read** 한다. 각 파일에서 가져오는 것:

- **`selection.json`**: `selectedCandidate`(단일이면 id, 아니면 null), `combinedSelection`(15요소→후보 매핑),
  `likes[]` / `dislikes[]`(후보·요소·메모), `notes`, `approvedAt`.
- **`references.json`**: 각 후보의 `name`·`apply`·`doNotApply`·`expectedImpression`·`scores`.
  → 출처 표기와 "그 후보에서 무엇을 가져오기로 했었나"의 근거.
- **`design-profile.json`**: `brand_impression`(우선순위)·`avoid`(금지 요소)·`weighting`(product/taste/brand)·
  `accessibility`. → 부적합 판단 기준 + 충돌 해결의 우선순위 가이드.

선택 항목 **15종 고정**(BUILD CONTRACT §4.3, `schemas/selection.schema.json`):
color, typography, navigation, density, buttons, forms, cards, tables, modals, icons, spacing, radius, shadow, images, motion.

---

## 단계

### 0단계 — 선행 산출물 확인 + selection 정규화

1. `design/compare/selection.json`, `design/research/references.json`, `design/design-profile.json` 존재 확인.
   - `selection.json` 이 없으면: `/design-compare` 를 먼저 돌리도록 안내한다. 그래도 진행해야 하면
     **AskUserQuestion** 으로 핵심 요소(최소 color·typography·navigation·density)에 대해 "어느 후보 방향이 좋았는지"를 받아
     최소 selection 을 구성한다(가짜 선택을 지어내지 않는다 — 사용자에게 받는다).
   - `references.json` 이 없으면 진행 불가에 가깝다(출처를 표기할 수 없다). `/design-research` 를 먼저 권한다.
2. **selection 정규화** — 두 입력 형태를 통일한다:
   - **단일 선택**(`selectedCandidate` 가 id, `combinedSelection` 비거나 동일 후보): 15요소를 모두 그 후보로 채워 조합 형태로 펼친다.
   - **조합 선택**(`selectedCandidate: null`, `combinedSelection` 에 요소별 후보): 그대로 사용. 빈 요소(미선택)는 *추정으로 채우지 말고* "미선택" 으로 둔 뒤 1단계에서 처리.
3. `approvedAt` 확인 — 비어 있으면 아직 사용자 확정 전이다. 합성은 진행하되, 최종 §3단계에서 AskUserQuestion 으로 승인을 받아 `approvedAt` 을 채운다(승인 없는 자동 확정 금지).

### 1단계 — 미선택 요소 처리 (추정 금지, 채움은 근거로)

조합 선택에서 비어 있는 요소가 있으면:

- **임의로 채우지 않는다.** 대신 다음 우선순위로 *근거 있는 기본값*을 제안한다:
  1. `likes[]` 에 같은 후보의 인접 요소가 있으면 그 후보를 우선 후보로.
  2. 없으면 `selectedCandidate`(있다면) 또는 점수 종합 1위 후보.
  3. 그래도 모호하면 **AskUserQuestion** 으로 사용자에게 묻는다(2~4개 묶어서 한 번에).
- 채운 모든 미선택 요소는 §2 표의 출처 칸에 `(미선택→추정: candidate-x)` 로 명시하고, DECISION-LOG 에 항목으로 남긴다.

### 2단계 — 디자인 합성 규칙 (BUILD CONTRACT §18)

선택을 방향으로 합성할 때 **반드시** 지킨다:

| # | 규칙 | 적용 |
|---|------|------|
| 1 | **특정 서비스 통째 복제 금지** | 한 후보를 전부 베끼지 않는다. 단일 선택이어도 "원칙"을 가져오지 외형을 복사하지 않는다. |
| 2 | **로고·고유 일러스트·카피 복사 금지** | 출처의 브랜드 자산을 방향에 옮기지 않는다. |
| 3 | **최소 2개 근거 검토** | 각 요소 채택은 ① 사용자 선택(likes/combinedSelection) ② 제품 적합성(프로필 `brand_impression`/`avoid`) 둘 다로 뒷받침. |
| 4 | **제품 부적합 요소 제외** | 사용자가 골랐어도 제품 목적과 정면 충돌하면 §3 절차로 위험을 알리고 대안을 제시(막지는 않음). |
| 5 | **선택 요소 간 시각 충돌 조정** | 색상·표면·밀도 등 전제가 어긋나면 §4 충돌 해결로 푼다(한쪽 임의 폐기 금지). |
| 6 | **기존 브랜드 자산 우선** | 프로젝트에 브랜드가 있으면(§17 가중치 20%) 브랜드 색/폰트를 선택보다 우선 반영하고 그 사실을 기록. |
| 7 | **출처 ↔ 적용 요소 기록** | 모든 요소가 *어느 후보에서 왔는지* 표로 남긴다(역추적성). |

합성의 핵심은 **시각 스타일 축과 UX 구조 축을 분리해 종합**하는 것이다(6원칙 #3).
색/타이포/표면/모서리 = 시각 축, 내비/밀도/테이블/폼/모달 = UX 구조 축. 두 축이 다른 후보에서 와도 정상이다.

### 3단계 — 제품 부적합 선택 처리 (막지 않되, 알린다)

사용자 선택이 제품 목적과 충돌하는 경우(예: 데이터 조밀 업무 도구인데 `images`/`spacing` 을 마케팅용
대형 히어로·과도한 여백 후보에서 가져옴, 또는 프로필 `avoid` 에 든 요소를 골랐음):

1. **충돌을 설명한다** — 무엇이 제품 목적/사용자 행동/프로필 `avoid` 와 어긋나는지 한두 문장.
2. **두 대안을 만든다**:
   - **대안 A (취향 유지)**: 사용자가 고른 그대로. 단 위험(예: "조밀 화면에서 여백 과다로 스크롤 증가")을 명시.
   - **대안 B (제품 적합 우선)**: 같은 인상을 유지하면서 제품에 맞게 조정한 버전(예: 여백을 comfortable→compact 로, 히어로 제거).
3. **AskUserQuestion** 으로 최종 선택을 받는다. 선택지에 §17 가중치를 한 줄 고지한다(브랜드 있음: 제품 50/취향 30/브랜드 20, 신규: 제품 60/취향 40 — 취향은 절대규칙이 아니라 가중 입력).
4. 사용자가 대안 A(부적합 유지)를 골라도 **그대로 진행**한다. DECISION-LOG 에 "위험 고지 후 사용자가 취향 유지 선택" 으로 기록한다.

> 이 단계는 사용자를 가르치려는 게 아니다. **판단에 필요한 정보를 주고 결정권은 사용자에게** 둔다.

### 4단계 — 충돌 해결 (조합 선택의 핵심 작업)

조합 선택은 후보 간 전제 충돌을 낳는다. 각 충돌마다 **3단 절차**:

1. **충돌 설명** — 무엇과 무엇이 어떤 전제에서 충돌하나.
   (예: `color`=candidate-a 는 다크 표면 전제, `cards`/`tables`=candidate-b 는 밝은 표면 + 1px 강한 보더 전제)
2. **제품 목적 기준 우선순위 제안** — 어느 쪽을 기준으로 맞출지, *제품 목적*과 프로필 `brand_impression` 으로 판단한다.
   (예: 업무 도구라 가독성·정보 위계 우선 → 밝은 표면 기준으로 통일, accent 색만 candidate-a 에서 차용)
3. **조정된 2개 대안 생성 + AskUserQuestion** — 두 해소안을 만들어 사용자가 고르게 한다.
   (예: 대안① 밝은 표면 기준 + a 의 warm accent / 대안② 다크 표면 기준 + b 의 보더 위계를 다크에 이식)

흔한 충돌 유형:

| 충돌 축 | 전형적 양상 | 기준 잡는 질문 |
|---------|------------|----------------|
| 표면 명도 | 다크 색상 후보 + 밝은 표면 전제 레이아웃 후보 | 핵심 화면을 오래 보는가? → 가독성·눈피로 기준 |
| 밀도 | compact 테이블 후보 + spacious 카드 후보 | 반복 업무 빈도? → 정보 밀도 기준 |
| 모서리·표면 | radius:none + 글래스/elevation 후보 | 제품 인상(기술적 vs 친근함)? |
| 모션 | minimal 후보 + expressive 후보 | 접근성(prefers-reduced-motion)·집중 vs 활기 |

- 충돌이 **없으면** §4 표에 "충돌 없음 — 선택 요소 간 전제 일관" 을 명시한다(빈 표 금지).
- 임의로 해결한 사항은 모두 `design/DECISION-LOG.md` 에 항목으로 남긴다.

### 5단계 — 산출물 작성

아래 3개 파일을 작성한다(경로 절대 고정 — BUILD CONTRACT §3).

#### (1) `design/DESIGN-DIRECTION.md`

`templates/DESIGN-DIRECTION.template.md` 의 구조를 **그대로** 채운다(섹션 1~8). 핵심 채움 규칙:

- **§1 선택 요약**: 단일/조합 여부 + 주된 출처 후보(예: `candidate-a`(시각) + `candidate-b`(UX 구조)).
- **§2 요소별 채택 표(15종)**: `selection.json` 의 `combinedSelection` 을 그대로 표로. 각 행에
  `채택 방향` / `출처 후보` / `근거`. **근거 칸에 "예뻐서" 금지** — 제품 목적·사용자 행동·인상과 연결.
  미선택→추정 요소는 출처 칸에 `(미선택→추정)` 표기.
- **§3 likes/dislikes 반영**: `likes[]` 가 방향에 살았는지, `dislikes[]` 가 확실히 배제됐는지 두 표로.
  "싫어요"가 방향에서 빠졌는지 확인하는 게 핵심.
- **§4 충돌 해결 결과**: 위 4단계 결과를 표로. 각 행에 `충돌 내용`/`해결 방향`/`근거`/`DECISION-LOG 기록 여부`.
- **§5 제품 고유 요소**: 어떤 후보에도 없는, 제품 맥락에서 발명한 요소 1~2개(복제 방지). `anti_clone_note` 한 문장.
- **§6 종합 서술(3~5문단)**: 시각 축/UX 축 분리 서술 + `brand_impression` 우선순위를 관통하는 한 문장.
- **§7 인계 사항**: 색/타이포/간격·밀도/모서리·표면·그림자/모션/avoid 를 `/design-system` 이 토큰화하기 좋게 추림.
  **hex 확정 금지** — "방향"으로만(예: "candidate-a 의 warm-neutral 계열, 채도 낮게").
- **§8 확정 상태**: `approved_at`(아래 승인 절차 결과), 미해결 충돌, 다음 단계 차단 요인.

#### (2) `design/selection.json` (확정 승격본)

`design/compare/selection.json` 의 **승격본**이다. `schemas/selection.schema.json` 형태를 **정확히** 따른다
(필드: `selectedCandidate`, `combinedSelection`(15종), `likes[]`, `dislikes[]`, `notes`, `approvedAt`).

- 정규화·충돌 해결로 **확정된 최종 매핑**을 `combinedSelection` 에 반영한다(미선택→추정으로 채운 요소 포함).
- 충돌 해결·부적합 결정으로 일부 선택이 조정됐다면 그 결과를 반영하되, 원래 `likes`/`dislikes` 는 보존한다.
- **`approvedAt` 은 사용자 승인 시각으로 채운다**(ISO 8601 date-time). 미승인 상태로 이 파일을 확정하지 않는다.
- `notes` 에 합성 시 내린 주요 판단 요약 한두 줄을 추가할 수 있다(원본 notes 보존 + 추가).

> 참고: `compare/selection.json → selection.json` 승격은 `scripts/export-selection.ts` 로도 수행할 수 있다
> (충돌 요약 + DECISION-LOG 항목 초안 생성). 스크립트를 쓰면 그 출력을 검토한 뒤 위 합성 결과로 보강한다.

#### (3) `design/DECISION-LOG.md`

`/design-select` 이후 내린 **모든 임의 결정**을 기록하는 누적 로그다. 이 파일은 이후 단계
(`/design-system`·`/design-prototype`)에서도 계속 추가된다 — 새로 만들 때 그 구조를 깔아둔다.

```markdown
# 의사결정 로그 — <project>

> 토큰에 없는 값·임의 판단·충돌 해결은 모두 여기에 이유와 함께 남긴다.
> (BUILD CONTRACT §16: "토큰에 없는 값 추가 시 design/DECISION-LOG.md 에 이유를 기록한다.")

## /design-select

| # | 결정 | 맥락 | 이유 | 출처/근거 |
|---|------|------|------|-----------|
| DL-001 | <예: color 충돌을 밝은 표면 기준으로 통일> | <어느 후보 간 충돌> | <제품 목적·가독성> | selection.json / 사용자 AskUserQuestion |
| DL-002 | <예: motion 미선택 → candidate-a 로 추정> | <조합 선택에 motion 비어 있음> | <인접 요소 동일 후보> | references.json scores |
| DL-003 | <예: 위험 고지 후 사용자가 취향 유지(대안 A) 선택> | <제품 부적합 spacing> | <사용자 최종 결정> | 사용자 AskUserQuestion |
```

기록 대상: ① 충돌 해결 방향 ② 미선택 요소 추정 ③ 제품 부적합인데 사용자가 유지한 선택 ④ 브랜드 자산 우선 적용
⑤ 기타 선택에 없던 임의 판단. **충돌·추정·부적합 유지가 하나도 없으면** 그 사실을 한 줄로 명시한다(빈 로그 금지).

### 6단계 — 사용자 승인 게이트 (자동 확정 금지)

산출물 초안을 만든 뒤, **AskUserQuestion** 으로 최종 방향을 확정받는다:

- 질문 예: "합성된 디자인 방향을 확정할까요?" / 선택지: ① 확정(승인) ② 특정 요소 수정 ③ 충돌 해결 재선택 ④ 보류.
- 사용자가 ①을 고르면 `selection.json` 의 `approvedAt` 과 DESIGN-DIRECTION §8 `approved_at` 을 현재 시각으로 채운다.
- ②③을 고르면 해당 부분을 고쳐 다시 제시한다(자동으로 다음 단계로 넘어가지 않는다).

> "생성보다 판단" — 사용자 승인 없이 `approvedAt` 을 채우거나 `/design-system` 으로 넘어가지 않는다.

---

## 산출물 경로 (절대 고정 — BUILD CONTRACT §3)

```
design/
├── DESIGN-DIRECTION.md      # 합성된 최종 디자인 방향 (templates/DESIGN-DIRECTION.template.md 구조)
├── selection.json           # 확정 선택 (compare/selection.json 승격본, schema §4.3)
└── DECISION-LOG.md          # /design-select 이후 모든 임의 결정 기록 (누적 시작점)
```

---

## 품질 체크 (저장 전)

- [ ] `selection.json` 이 `schemas/selection.schema.json` 형태와 정확히 일치(필드명·`combinedSelection` 15종·`approvedAt`).
- [ ] **모든 채택 요소에 출처 후보 + 근거**가 붙어 있다(근거 없는 요소 0개, "예뻐서" 금지).
- [ ] **시각 축 ↔ UX 축 분리** 종합(두 축이 다른 후보에서 와도 일관되게 합성).
- [ ] `dislikes[]` 가 방향에서 확실히 **배제**됐다(§3.2 표로 확인).
- [ ] **충돌**이 §4 표에서 명시 해결됐다(또는 "충돌 없음" 명시). 임의 해결은 DECISION-LOG 에 기록.
- [ ] 제품 부적합 선택이 있었다면 **위험 고지 + 2대안 + 사용자 최종 결정**을 거쳤다(막지 않음).
- [ ] **복제 방지**: 어떤 후보도 통째로 베끼지 않았고(원칙만 차용), 제품 고유 요소가 §5 에 있다.
- [ ] hex 등 실제 토큰 값을 여기서 확정하지 않았다(방향만 — 값 확정은 `/design-system`).
- [ ] `approvedAt` 이 **사용자 승인 후** 채워졌다(자동 확정 금지).
- [ ] DECISION-LOG 에 충돌·추정·부적합 유지 결정이 빠짐없이 기록됐다(없으면 그 사실 명시).
- [ ] 자기 문서·합성 결과에 진부한 AI 기본값(순수 #000/#fff, Tailwind 기본 보라/파랑, 이모지 장식, 가짜 수치, 균등 카드 그리드)이 없다.

---

## 다음 단계

`/design-system` — `design/DESIGN-DIRECTION.md`(특히 §2 요소별 방향, §7 인계 사항)와
`design/selection.json` 을 입력으로, `design/DESIGN.md` + `design/TOKENS.json`(모든 색/간격/폰트/모서리의
단일 출처) + `design/COMPONENTS.md` 외 6종을 생성한다. 이 단계에서 "방향"으로만 둔 색·간격이 거기서 실제 토큰 값으로 확정된다.

> 방향이 확정됐다고 디자인이 끝난 게 아니다. 이 문서는 시스템·목업의 **기준선**이다.
> 사용자 승인(`approvedAt`)이 없으면 다음 단계로 넘어가지 않는다.
