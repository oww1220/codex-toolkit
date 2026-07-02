# 예시 — admin-dashboard (관리자 업무 도구)

> 이 폴더는 *실행 결과 스냅샷*이 아니라 **입력 시나리오 + 핵심 산출물 발췌**다.
> `ai-design-director` 스킬을 사내 관리자 도구에 돌렸을 때 9단계 파이프라인이 무엇을
> 만들어내는지 보여준다. 발췌 수준으로 간결하지만, 형태는 실제 산출물과 동일하다.
> (전체 산출물 트리는 `.build/CONTRACT.md` §3, 스키마는 §4 참조)

---

## 시나리오 (입력)

운영팀이 주문·회원·정산을 하루 종일 들여다보는 **내부 관리자 도구(admin)**.
화면을 오래 띄워두고, 같은 작업을 수십 번 반복하고, 키보드로 빠르게 처리한다.

운영자가 스킬에 처음 던진 말 (말로 설명한 취향):

> "예쁜 것보다 빠른 게 중요해요. 한 화면에 정보가 최대한 많이 보였으면 하고,
> 필터·검색·일괄처리가 빨라야 해요. 마우스로 카드 누르고 다니는 SaaS 랜딩 느낌
> 말고, 엑셀처럼 표가 중심이었으면. 강조색이 너무 많으면 오히려 헷갈려요."

핵심 작업(JTBD):
- **검색·필터로 좁힌다 → 표에서 훑는다 → 일괄 선택·처리한다 → 상세를 빠르게 편집한다**
- 키보드 우선, 화면 전환 최소, 정보 밀도 최대

이 진술만으로 결정하지 않는다 — 스킬은 후보(밀도·테이블·강조색이 다른)를 보여주고,
사용자가 무엇이 좋은지/싫은지/왜인지를 *선택*하게 한다. (6원칙 #2: 말보다 선택)

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
| 7–8 | `/design-prototype` · `/design-audit` | (목록·필터·상세패널·일괄처리 4화면 — 발췌 생략) |

---

## 선택 요약 (selection.json 핵심)

밀도와 속도가 전부인 도구라, **조합 선택**으로 갔다.

- **테이블·정보 밀도·필터**는 `candidate-a` Dense Operations — 조밀한 행 높이, 고정 헤더, 인라인 편집.
- **색·표면·전반 톤**은 `candidate-c` Neutral Slate — 차분한 회색 표면 + 강조색 1색(teal) 절제.
- **검색·키보드 흐름**은 `candidate-b` Command-First — 상단 명령형 검색 + 단축키 노출.

거부한 것: `candidate-d` Marketing SaaS 의 카드 그리드 대시보드 + 채도 높은 멀티 강조색(밀도/속도와 충돌).

자세한 이유는 `DESIGN-BRIEF.md` / `design-profile.json` / `selection.json` 참조.

---

## 다른 예시와의 구별

| | admin-dashboard | content-platform | crm |
|---|---|---|---|
| 톤 | 업무 도구 / 조밀 | editorial / 잡지 | 고객·매출 관리 |
| 배경 | cool off-white (slate) | warm off-white (paper) | (crm 예시 참조) |
| 폰트 | UI sans + 수치 mono | serif display + humanist sans | (crm 예시 참조) |
| 밀도 | high (테이블 우선) | spacious (읽기 컬럼) | medium |
| 강조색 | restrained teal | ink terracotta | (crm 예시 참조) |
| 모서리 | none~sm (각진 표) | small | (crm 예시 참조) |

세 예시는 같은 토큰을 복사하지 않는다. 제품 목적이 다르면 결과 디자인도 달라야 한다.
