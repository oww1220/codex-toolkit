# 디자인 후보 비교 앱 (compare-ui 스캐폴드)

AI Design Director 파이프라인 **4단계 `/design-compare`** 가 사용자 프로젝트의
`design/compare/` 로 복사해 쓰는 **후보 비교 앱**의 템플릿(스캐폴드)이다.

> **핵심 불변식 — 동일 조건 비교**
> 모든 후보는 `public/data/content.json` 의 **같은 콘텐츠**(같은 문장·데이터·화면)를 쓰고,
> `public/data/candidates.json` 의 **디자인 토큰만** 다르다. 콘텐츠가 후보마다 갈라지면
> 비교가 무의미해지고 이 단계는 실패다. 이 앱은 그 불변식을 코드로 강제한다 —
> 화면 컴포넌트는 `content.json` 한 곳에서만 내용을 읽고, 후보는 CSS 변수(`--dd-*`)만 갈아끼운다.

---

## 구동법

Node 18+ 와 npm 이 필요하다.

```bash
npm install        # 의존성 설치 (react, react-dom, vite, typescript)
npm run dev        # 개발 서버 → http://localhost:5173
npm run build      # 타입 검사(tsc --noEmit) + 프로덕션 빌드(dist/)
npm run preview    # 빌드 결과 정적 미리보기
```

`npm run build` 가 타입 오류 없이 통과하면 데이터·타입이 정합한다는 뜻이다.
빌드 산출물(`dist/`)은 `base: "./"` 로 빌드되어 임의 경로에서 정적 서빙해도 자산 경로가 깨지지 않는다.

---

## 사용법 (앱 안에서)

| 기능 | 위치 |
|------|------|
| 후보 A~E 전환 | 상단 후보 탭 |
| 나란히 보기 / 단일 보기 | 후보 탭 우측 토글 |
| 화면 전환(대시보드·목록·상세·폼) | 툴바 "화면" |
| 뷰포트(데스크톱·태블릿·모바일) | 툴바 "뷰포트" |
| 라이트 / 다크 | 툴바 우측 |
| 전체화면(패널 숨김) | 툴바 우측 |
| 요소 15종 좋아요/싫어요 | 우측 패널 "요소별 선호 · 조합" |
| 요소 단위 조합 선택 | 각 요소의 드롭다운("…에서 가져오기") |
| 단일 후보 전체 선택 | 우측 패널 상단 버튼 |
| 선택 내보내기 | 툴바 "선택 내보내기" → `selection.json` 다운로드 |

선택 상태는 브라우저 **LocalStorage** 에 자동 저장되고, "선택 내보내기" 로
`selection.json`(스키마: `schemas/selection.schema.json`)을 내려받는다. 다운로드한 파일을
`design/compare/selection.json` 으로 두면 다음 단계 `/design-select` 가 읽는다.
`approvedAt` 은 이 단계에서 항상 빈 문자열이다 — **확정은 `/design-select` 의 몫**이며 자동 확정하지 않는다.

---

## 데이터 교체법

이 스캐폴드의 `public/data/*.json` 은 **샘플(개인사업자 CRM)** 이다.
`/design-compare` 커맨드(또는 `scripts/create-comparison.ts`)가
`design/research/references.json` 을 바탕으로 두 파일을 교체한다.

### `public/data/content.json` — 모든 후보 공통 콘텐츠

대표 화면 4종(대시보드 / 목록 / 상세 / 폼)에 들어갈 **모든 텍스트·숫자·데이터**.
후보가 달라져도 절대 갈라지지 않는 단일 콘텐츠 소스. 형태는 `src/types.ts` 의 `Content` 와 정합.
가짜 수치(99% / 10x) 대신 제품 유형에 맞는 그럴듯한 실데이터 형태(고객명·금액·날짜·상태)를 둔다.

### `public/data/candidates.json` — 후보별 토큰 (디자인만 다름)

`references.json` 의 후보 `id`(`candidate-a` … `candidate-g`)·`name` 과 **정합**해야 한다.
각 후보는 색(라이트/다크)·타이포·모서리·간격·내비게이션·밀도 등 **토큰만** 담는다(콘텐츠 금지).
형태는 `src/types.ts` 의 `Candidate`(+ `CandidatesFile`) 와 정합.

> 두 파일을 교체한 뒤 반드시 `npm run build` 로 타입 정합을 확인한다.
> 빌드가 깨지면 대개 데이터 형태가 `src/types.ts` 와 어긋난 것이다.

---

## 디렉터리 구조

```
compare-ui/
├── package.json  vite.config.ts  tsconfig.json  tsconfig.node.json  index.html
├── public/data/{content.json, candidates.json}   # 앱이 fetch 하는 데이터(교체 대상)
└── src/
    ├── main.tsx  App.tsx  index.css               # 진입 · 루트 · 도구 셸 스타일
    ├── types.ts                                    # Content/Candidate/Selection 타입(스키마 정합)
    ├── theme.ts                                    # Candidate 토큰 → CSS 변수(--dd-*) 주입
    ├── store.ts                                    # 선택 상태 + LocalStorage + selection.json export
    ├── components/                                 # 도구 셸 UI
    │   ├── Toolbar.tsx          # 화면·뷰포트·테마·전체화면·내보내기
    │   ├── CandidateTabs.tsx    # 후보 전환 + 나란히 보기 토글
    │   ├── ViewportFrame.tsx    # 후보 토큰을 주입해 한 화면을 한 뷰포트로 렌더
    │   ├── SideBySide.tsx       # 모든 후보 나란히
    │   ├── SelectionPanel.tsx   # 설명·추천 이유·단일 선택·메모
    │   └── ElementPicker.tsx    # 요소 15종 좋아요/싫어요 + 조합 선택
    └── screens/                                    # 대표 화면(토큰만 갈아끼우면 모든 후보 표현)
        ├── screens.css   shared.tsx                # --dd-* 만 쓰는 미리보기 스타일 · 공통 셸/배지
        └── Dashboard.tsx  ListView.tsx  DetailView.tsx  FormView.tsx
```

### 두 색 세계의 격리

- **도구 셸** 색은 `src/index.css` 의 `--sh-*` (중성 슬레이트). 후보와 무관.
- **후보 미리보기** 색은 `src/theme.ts` 가 주입하는 `--dd-*`. 화면 컴포넌트는 이것만 쓴다.
- 셸 색이 미리보기 안으로 새지 않게 격리해, 후보 인상이 도구 색에 오염되지 않는다.

---

## 대표 화면 (이 스캐폴드 기준: SaaS / 업무 도구)

대시보드 · 목록(테이블) · 상세 · 폼. 제품 유형이 다르면 `/design-compare` 가 화면 세트를
바꾼다(콘텐츠/미디어: 홈·목록·상세·검색 / 커머스: 상품목록·상세·장바구니·주문 / 모바일: 홈·기능·상세·설정).
화면은 **밀도·테이블 vs 카드·내비게이션 구조**가 후보 간에 어떻게 갈리는지가 잘 드러나도록 고른다.

---

## 이 앱 자체의 디자인 규약 (자기 적용)

이 비교 도구 자체도 AI slop 회귀를 막는 것이 상품이므로 동일 기준을 지킨다:
순수 `#000`/`#fff` 미사용(살짝 톤 띤 중성색), Tailwind 기본 blue/violet 미사용,
이모지 장식·의미 없는 그라데이션·균등 카드 그리드 회피, 도구 셸은 정보 위계(주: 미리보기 / 부: 설명·선호)가 보이게 구성.
