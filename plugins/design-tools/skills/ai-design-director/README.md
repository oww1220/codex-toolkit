# AI Design Director

> 사용자가 자신의 디자인 취향을 정확히 설명하지 못하더라도, **실제 서비스의 디자인 레퍼런스를
> 탐색·비교**하게 하여 취향을 *발견*한 뒤, 이를 **일관된 디자인 시스템과 실제 제품 목업**으로
> 변환하는 AI 디자인 디렉터 스킬.

Claude Code(및 호환 AI 코딩 에이전트)에서 실행하는 디자인 전문 스킬 패키지. 초기 버전은 Claude
Code를 우선 지원한다.

## 왜 필요한가

AI 코딩 도구로 UI를 만들면 높은 확률로 **똑같이 진부한** 결과가 나온다 — 보라/파랑 그라데이션,
둥근 카드 반복, 거대한 히어로, 의미 없는 글로우. 이건 모델 능력 부족만이 아니라, 사용자가 주는
정보가 "세련되게/깔끔하게/요즘 트렌드로" 수준이라 **해석 범위가 너무 넓어** AI가 학습 분포의
최빈값으로 회귀하기 때문이다.

대부분의 사용자는 디자인 전문가가 아니다. **취향을 처음부터 언어로 정의하는 데는 서툴지만, 여러
대상을 비교하고 선택하는 일은 잘한다.** 이 스킬은 그 전제에서 출발한다.

## 핵심 차별점

기존 AI 디자인 생성: `설명한다 → AI가 임의로 디자인 → 마음에 안 든다 → 다른 색·카드로 재생성` (무한 반복).

AI Design Director:
```
제품을 이해한다 → 사용자의 말을 디자인 언어로 번역한다 → 실제 레퍼런스를 탐색한다
→ 동일 조건의 후보를 보여준다 → 사용자가 선택한다 → 선택을 디자인 시스템으로 만든다
→ 핵심 사용자 흐름을 구현한다 → 결과를 검증하고 수정한다
```

경쟁력은 디자인 생성 능력이 아니라, **사용자가 스스로 설명하지 못하는 취향을 발견하고, 선택의
근거를 만들어주며, 그 선택을 제품 전체에 일관되게 적용하는 과정**이다.

## 4가지 역할

- **디자인 인터뷰어** — 막연한 아이디어를 구체적 제품 요구사항으로 정리
- **디자인 번역가** — 일상 언어를 색상/타이포/밀도/레이아웃 등 디자인 언어로 번역
- **디자인 큐레이터** — 실제 레퍼런스에서 적합한 후보를 비교 가능한 형태로 제공
- **디자인 감사관** — 구현 결과가 선택 방향·디자인 시스템을 지키는지 반복 검증

## 설치

이 폴더를 Claude Code 스킬로 인식되는 위치에 둔다 (예: 프로젝트의 `.claude/skills/ai-design-director/`
또는 사용자 전역 `~/.claude/skills/ai-design-director/`). 스킬 디스커버리가 `SKILL.md` 의
frontmatter 를 읽어 트리거한다.

스크립트/compare-ui 실행에 필요한 런타임:
- Node.js 18+ (스크립트는 `tsx` 로 실행)
- compare-ui: `npm install && npm run dev` (Vite + React + TypeScript)
- 스크린샷 캡처/감사: Chromium 기반 브라우저 + Playwright(또는 브라우저 MCP)

## 사용법

```
/design-full          # 아이디어부터 감사까지 전체 안내 (어디서 시작할지 모를 때)

/design-brief         # 1. 제품·사용자 인터뷰
/design-translate     # 2. 사용자 언어 → 디자인 언어
/design-research      # 3. 레퍼런스 탐색·평가
/design-compare       # 4. 동일 콘텐츠 비교 앱 생성
/design-select        # 5. 선택 합성 → 디자인 방향
/design-system        # 6. 디자인 시스템 문서 + 토큰
/design-prototype     # 7. 핵심 사용자 흐름 목업
/design-audit         # 8. 디자인 감사 + 개선 루프
```

`/design-full` 은 사용자 승인 없이 **후보 선택 단계를 자동으로 건너뛰지 않는다.**

## 디렉토리 구조

```
ai-design-director/
├── SKILL.md              스킬 진입점 (frontmatter + 실행 가이드)
├── README.md             이 문서
├── commands/             9개 커맨드 플레이북
├── agents/               7개 에이전트 역할 정의
├── templates/            산출 문서 빈 골격 8종
├── schemas/              JSON Schema (design-profile/references/selection/tokens/audit/user-profile)
├── references/           내부 참조 지식 (anti-patterns / design-vocabulary / reference-taxonomy / quality-gates)
├── providers/            ReferenceProvider 추상화 + web/stitch/manual 어댑터
├── compare-ui/           /design-compare 가 복사하는 React/Vite 비교 앱 스캐폴드
├── scripts/              tsx 실행 스크립트 5종
└── examples/             crm / content-platform / admin-dashboard 시나리오
```

## 산출물 (사용자 프로젝트 `design/`)

`SKILL.md` 의 "무엇을 만드나" 섹션 참조. 핵심은 **`design/TOKENS.json` 이 색/간격/폰트/모서리의
단일 출처**라는 점 — 구현은 여기서만 값을 가져온다. `/design-system` 완료 시 사용자 프로젝트
`CLAUDE.md` 에 Design Rules 블록을 추가해 AI가 구현 중에 디자인 시스템을 무시하지 않도록 강제한다.

## 설계 원칙

1. 생성보다 판단 · 2. 말보다 선택 · 3. 시각/UX 분리 · 4. 동일 조건 비교 · 5. 단일/조합 선택 · 6. 모든 결정엔 이유.

## 비목표 (초기 버전)

Figma 대체 / 디자이너 없는 완전자동 / 픽셀 복제 / 승인 없는 자동 확정 / 모든 브랜드 자산 자동생성 /
복잡 3D·고급 모션 자동구현 / 모든 프런트엔드 프레임워크 동시 지원.

## 로드맵

- **v1.1** — 사용자 취향 프로필 재사용, UX Pattern 전용 탐색, 접근성 자동 검사, Tailwind 테마 자동 변환, 디자인 변경 이력.
- **v2.0** — Codex/Kimi Code 지원, Figma Export, 팀 단위 선택·투표, 기존 웹사이트 자동 리디자인, 디자인 시스템 버전 관리.
