---
name: design-orchestrator
description: >
  디자인 작업을 Layout, Color, Typography, Accessibility 등 역할 관점으로 나눠 검토하고, 필요한 경우 기존
  ai-design-director와 subagent-orchestration 흐름에 연결하는 얇은 디자인 오케스트레이터. 트리거 — "Design
  Orchestrator", "design orchestrator", "디자인 에이전트 팀", "16개 디자이너 역할", "디자인 관점별로 검토해줘", "레이아웃 색상
  타이포 접근성 같이 봐줘", "디자인 역할 나눠서 봐줘". 비-트리거: 단순 CSS 한 줄 수정처럼 디자인 판단이 필요 없는 작업; 이미 구체적인 UI 구현 지시가
  있어 역할별 검토가 불필요한 작업; 디자인과 무관한 버그 수정, 빌드 실패, 백엔드 또는 데이터 작업.
---

# Design Orchestrator

1. 요청을 읽고 디자인 판단이 필요한지 먼저 확인한다. 단순 구현이면 이 스킬을 쓰지 않고 일반 작업으로 처리한다.
2. 작업 성격에 맞는 역할만 고른다. 기본 후보는 Layout Designer, Color Specialist, Typography Expert, Accessibility Auditor이며, 필요할 때만 나머지 역할을 추가한다.
3. 큰 방향 탐색, 레퍼런스 비교, 디자인 시스템 생성이 필요하면 `ai-design-director`를 사용한다. 단순 관점 분해나 리뷰면 현재 에이전트가 역할별로 짧게 검토한다.
4. 병렬 검토 이득이 뚜렷할 때만 `subagent-orchestration`을 사용한다. 16개 역할을 전부 띄우지 말고 보통 2개 사전 검토와 1개 사후 검토로 제한한다.
5. 역할별 검토는 같은 화면을 기준으로 Layout, Color, Typography, Accessibility, Interaction, UX Writing, Design System, Visual QA, Motion, Iconography, Responsive, Product, Form UX, Data Visualization, Empty/Error State, Final Review 중 필요한 항목만 출력한다.
6. 결과는 바로 적용 가능한 결정, 수정 후보, 검증 방법만 남긴다. 장식적 역할극이나 긴 페르소나 설명은 생략한다.
