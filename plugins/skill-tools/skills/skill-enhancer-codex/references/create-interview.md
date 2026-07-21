# CREATE Interview — 후속 질문 대본 (answer → audit-clean)

> **로드 시점**: CREATE 모드를 실행할 때. 7개 메타데이터 질문 **다음에**, 본문을 채우는 후속 질문을 이 대본대로 이어간다.

## 계약 (이게 핵심)
이 대본의 질문에 **전부 답하면**, 답이 곧 `config.json`이 되고 `scaffold.py`가 **audit-clean 스킬**(0 HARD, 트리거·anti-trigger·게이트·references를 다 채우면 0 WARN)을 렌더한다.
**"자리표시자를 채운다"가 아니라, "질문에 답하면 본문이 채워진다."** 비전공자도 도메인 답만 하면 된다.

## 운영 원칙
- 모든 결정은 **`request_user_input`** 으로. 객관식이 가능하면 객관식, 자유 입력이 필요하면 그렇게.
- **한 번에 한 라운드.** 라운드마다 답을 `config.json`에 누적한다.
- scaffold 실행 후 출력의 **"남은 인터뷰 항목"** 이 비고, `audit.py`가 통과할 때까지 **계속 묻는다**. 막연히 끝내지 않는다.
- 사용자가 "본문 통째로 줄게"라고 하면 받아서 채우고, 모르면 라운드별로 끌어준다(둘 다 지원).

---

## 라운드 1 — 메타데이터 (→ frontmatter + scaffold 설정)
| 질문 | config 필드 | 채우는 곳 | 만족 audit |
|---|---|---|---|
| 스킬 이름은? (kebab) | `name` | frontmatter name | name/name-kebab/name-len |
| 한 문장 목적은? | `purpose` | description | description |
| **누가 부르나?** 사용자 직접 / 다른 스킬(오케스트레이터) | `routed_by` | 라우팅 | discovery |
| (사용자) 어떤 말로 부르나? 2~5개 인용구 | `triggers` | description 트리거 | discovery |
| 언제는 **쓰면 안 되나?** (헷갈릴 인접 요청) | `anti_triggers` | description 비-트리거 | anti-trigger |
| 어떤 도구/스크립트가 필요한가? | `tools_note` | body | scripts/references 필요 판단 |
| 통째 위임형(thin)인가? | `thin` | 본문 형태 | — |

> Codex frontmatter는 `name`과 `description`만 생성한다.

---

## 라운드 2 — 정체성 & 제약 (→ 본문 상단)
| 질문 | config 필드 | 채우는 곳 |
|---|---|---|
| 이 스킬을 **한 줄로** 하면? (무엇을/언제) | `one_liner` | `## 무엇을/언제` |
| **반드시 하는 것** 1~3개 | `must_do` | `## 제약` ✅ |
| **절대 안 되는 것** 1~3개 | `must_not` | `## 제약` ⛔ |

> 제약은 **스텝 위에** 둔다(불변식 먼저). 출력 규율(채팅 덤프·설치 디렉터리 쓰기 금지)은 scaffold가 자동으로 한 줄 추가.

---

## 라운드 3 — 워크플로우 & 검증 게이트 (→ 본문 핵심)
| 질문 | config 필드 | 채우는 곳 | 만족 audit |
|---|---|---|---|
| 단계가 **몇 개**인가? (1개로 충분 vs 3~5개) | `workflow[]` 길이 | `## 핵심 워크플로우` | — |
| 각 단계: 무엇을 하고 **입력→출력**은? | `workflow[].action/io` | 번호 절차 | — |
| 검증은 **스크립트 게이트**인가 단순 확인인가? | `gate.type` (`script`/`manual`) | 검증 스텝 | gate |
| (스크립트) 실행 명령과 실패 시 행동은? | `gate.cmd`, `gate.on_fail` | 게이트 줄 | script-missing(스텁 자동 생성) |
| 산출물은 **어디**로 가나? | `output_required` | `## 출력 위치` | output-path |

> `gate.type=="script"`면 scaffold가 `scripts/<cmd의 파일>` **스텁**(non-zero로 종료하는 골격)을 만들어 포인터를 해소한다. 작성자는 TODO만 채우면 된다. **prose "수동 확인" 대신 스크립트 게이트를 권장**한다.

---

## 라운드 4 — 모드 (출력 유형이 2개 이상일 때만)
| 질문 | config 필드 | 채우는 곳 |
|---|---|---|
| 모드/출력 유형이 여러 개인가? 각각 이름·시작점·언제 | `modes[]` `{label,start,when}` | `## Step 0` 표 |

> 단일 목적이면 이 라운드는 건너뛴다(불필요한 Step-0 표는 만들지 않는다).

---

## 라운드 5 — 참조 자료 (무거운 detail을 references/로)
SKILL.md가 ~500줄을 넘거나, 상세 스펙·컴포넌트·단계별 프로토콜이 필요하면:
| 질문 | config 필드 | 채우는 곳 | 만족 audit |
|---|---|---|---|
| 보충 문서가 필요한 주제는? (없으면 0개) | `references[]` | 라우팅 표 | — |
| 각 문서: 파일명 / **언제 읽나(로드 트리거)** / 한 줄 요약 | `references[].file/when/summary` | 표 행 + 스텁 파일 | refs-untriggered, refs-dangling |

> 각 reference는 scaffold가 `references/<file>` **스텁**(`> 로드 시점: <when>` + 요약)으로 만든다 → **dangling 없음 + untriggered 없음**. 작성자는 본문을 채운다. (인덱스가 많으면 `_index.md` + index-then-one-file.)

---

## 라운드 6 — 오케스트레이터 (다른 스킬을 부를 때만)
| 질문 | config 필드 | 채우는 곳 |
|---|---|---|
| 파이프라인 위치 / 입력 / 출력 / 호출 스킬 목록 | `pipeline` `{position,input,output,calls}` | `## Pipeline Context` |

> 필요한 디스패치/서브에이전트 규칙은 본문에 명시한다. frontmatter에는 넣지 않는다.

---

## 마무리 — 조립 → 게이트
1. 누적한 답을 `config.json`으로 쓴다 (cwd 상대, 예: `./.skill-build/<name>.json`).
2. `python3 <skill-root>/scripts/scaffold.py <config.json> <skill-dir>` 실행.
3. 출력의 **"남은 인터뷰 항목"** 이 있으면 그 항목만 다시 묻고 config에 추가 → 재실행.
4. **`python3 <skill-root>/scripts/audit.py <skill-dir>`** → HARD 0이면 완료. WARN이 남으면 해당 필드를 더 받아 채운다.

이렇게 하면 **"질문만 따라 답하다 보면 audit을 통과하는 스킬"** 이 된다. 단, audit은 하한 게이트일 뿐 — 본문의 *도메인 깊이*(실제 규칙·예시·정확도)는 작성자가 채워야 진짜 좋은 스킬이 된다([authoring-checklist.md](./authoring-checklist.md)).
