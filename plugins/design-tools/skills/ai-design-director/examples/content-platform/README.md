# 예시 — content-platform (콘텐츠 서비스)

> 이 폴더는 *실행 결과 스냅샷*이 아니라 **입력 시나리오 + 핵심 산출물 발췌**다.
> `ai-design-director` 스킬을 콘텐츠 서비스에 돌렸을 때 9단계 파이프라인이 무엇을
> 만들어내는지 보여준다. 발췌 수준으로 간결하지만, 형태는 실제 산출물과 동일하다.
> (전체 산출물 트리는 `.build/CONTRACT.md` §3, 스키마는 §4 참조)

---

## 시나리오 (입력)

긴 글·에세이·리포트를 큐레이션해 보여주는 **읽기 중심 콘텐츠 서비스**.
운영자 1인 + 외부 필자 다수. 독자는 출퇴근/잠들기 전에 길게 읽는다.

운영자가 스킬에 처음 던진 말 (말로 설명한 취향):

> "뉴스레터보다 잡지에 가까웠으면 좋겠어요. 글이 주인공이고 UI는 뒤로 빠졌으면.
> 오래 읽어도 눈이 안 피로하고, 스크롤하다 길을 잃지 않게. 스타트업 SaaS 대시보드
> 느낌이나 떠다니는 카드 그리드는 싫어요. 근데 올드해 보이는 것도 싫고요."

핵심 작업(JTBD):
- 독자: **읽는다 → 분류로 더 찾는다 → 검색한다 → 저장/공유한다**
- 운영자: 글을 발행하고 분류·추천을 정리한다 (이 예시는 독자 흐름 중심)

이 한 문장짜리 취향 진술만으로는 결정하지 않는다 — 스킬은 후보를 보여주고
무엇이 좋은지/싫은지/왜인지를 사용자가 *선택*하게 한다. (6원칙 #2: 말보다 선택)

---

## 이 예시가 보여주는 흐름

| 단계 | 커맨드 | 이 폴더의 발췌 |
|------|--------|----------------|
| 1 | `/design-brief` | `DESIGN-BRIEF.md` (인터뷰 정리 발췌) |
| 2 | `/design-translate` | `design-profile.json` (말 → 디자인 언어) |
| 3 | `/design-research` | `references.json` (후보 5개 발췌) |
| 4 | `/design-compare` | (사용자 프로젝트 `design/compare/` 에 생성 — 발췌 생략) |
| 5 | `/design-select` | `selection.json` (조합 선택 결과) |
| 6 | `/design-system` | `TOKENS.json` (토큰 단일 출처 발췌) |
| 7–8 | `/design-prototype` · `/design-audit` | (홈·목록·상세·검색 4화면 — 발췌 생략) |

---

## 선택 요약 (selection.json 핵심)

독자가 글에 집중하도록, **조합 선택**으로 갔다.

- **타이포·여백·읽기 흐름**은 `candidate-a` Warm Editorial — serif display + 넉넉한 본문 행간, 단일 읽기 컬럼.
- **분류·검색·내비게이션 구조**는 `candidate-b` Quiet Index — 좌측 영구 분류 + 상단 검색, 무한 카드 그리드 거부.
- **이미지·썸네일 처리**는 `candidate-d` Photo-Forward — 가로 와이드 1장 + 캡션, 균등 썸네일 그리드 회피.

거부한 것: `candidate-e` Bright Consumer 의 채도 높은 강조색 + 둥근 카드(잡지 톤과 충돌).

자세한 이유는 `DESIGN-BRIEF.md` / `design-profile.json` / `selection.json` 참조.
스킬 전체 동작은 패키지 루트 `README.md` 와 `.build/CONTRACT.md` 를 본다.

---

## 다른 예시와의 구별

| | content-platform | admin-dashboard | crm |
|---|---|---|---|
| 톤 | editorial / 잡지 | 업무 도구 / 조밀 | 고객·매출 관리 |
| 배경 | warm amber-cream (paper) | cool off-white (slate) | warm cream (off-white) |
| 폰트 | Fraunces old-style serif + Source Sans 3 | Inter Tight UI sans + 수치 mono | Source Serif 4 transitional serif + IBM Plex Sans |
| 밀도 | spacious (읽기 컬럼) | high (테이블 우선) | medium-high (입력·목록 조밀) |
| 강조색 | deep petrol-blue (마스트헤드) | restrained teal | warm clay (terracotta) |

세 예시는 같은 토큰을 복사하지 않는다. 제품 목적이 다르면 결과 디자인도 달라야 한다.
