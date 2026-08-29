# 읽기 쉬운 SCSS 주석 예시

SCSS 주석은 일반적인 시각 결과가 아니라 제거하거나 바꾸면 회귀하는 제약과 재사용 계약을 설명한다.

## 브라우저 대응

```scss
.search-field::-webkit-search-cancel-button {
  // Chromium·Safari 기본 삭제 버튼이 별도 clear 버튼과 겹치므로 숨긴다.
  -webkit-appearance: none;
  appearance: none;
}
```

브라우저와 증상을 적고, 확인하지 않은 버전 범위나 추측한 원인은 쓰지 않는다.

## 외부 스타일 override

```scss
.calendar-popup {
  // 외부 위젯이 주입하는 inline width를 반응형 컨테이너 너비로 덮어쓴다.
  width: 100% !important;
}
```

`!important` 앞에는 덮어쓰는 대상과 일반 specificity로 해결할 수 없는 이유를 남긴다.

## 특수 breakpoint와 레이아웃 계산

```scss
@media (max-width: 68rem) {
  // 20rem 패널 두 개와 2rem gap이 함께 들어가지 않는 지점이라 공통 breakpoint를 쓰지 않는다.
  .account-layout {
    grid-template-columns: 1fr;
  }
}

.result-panel {
  // 고정 헤더와 하단 작업 영역을 제외한 화면 높이만 스크롤 영역으로 사용한다.
  max-height: calc(100dvh - var(--header-height) - var(--action-height));
}
```

숫자와 계산식은 근거가 코드에 드러나지 않을 때만 설명한다.

## stacking context와 z-index

```scss
.dialog-backdrop {
  // 앱 셸의 transform이 만든 stacking context 안에서 header(20)보다 위에 놓는다.
  z-index: 30;
}
```

숫자의 크기보다 비교 대상과 stacking context 경계를 기록한다.

## mixin과 function 계약

```scss
/// 한 줄 말줄임을 해제하고 지정한 줄 수만큼 본문을 노출한다.
/// @param {Number} $lines - 2 이상의 표시 줄 수
/// @content 말줄임 대상에 추가할 선택적 스타일
@mixin line-clamp($lines) {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: $lines;
  overflow: hidden;
  @content;
}

/// px 기반 디자인 값을 rem으로 변환한다.
/// @param {Number} $pixels - 단위 없는 px 기준값
/// @return {Number} 루트 글꼴 크기를 기준으로 계산한 rem 값
@function rem($pixels) {
  @return calc($pixels / 16) * 1rem;
}
```

재사용 API에는 허용 단위, 입력 범위, 생성되는 CSS와 `@content` 책임을 설명한다.

## 디자인 토큰과 fallback

```scss
.status-banner {
  // 임베드 환경에는 theme 토큰이 없을 수 있어 접근성 대비를 확인한 기본색을 유지한다.
  background: var(--status-warning-bg, #fff4cc);
}
```

fallback이 필요한 실행 환경이나 호환 경계를 적는다. 토큰 이름을 그대로 풀이하지 않는다.

## 모션과 접근성

```scss
.drawer {
  transition: transform 180ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  // 위치 변화는 유지하되 전정기관 부담을 줄이기 위해 중간 애니메이션만 제거한다.
  .drawer {
    transition: none;
  }
}
```

상태 전이가 복잡하면 시작·종료 상태와 중단 시 동작을 설명하고, reduced-motion 대응 의도를 남긴다.

## 모바일 viewport와 safe area

```scss
.bottom-actions {
  // 홈 인디케이터 영역을 침범하지 않도록 기존 여백에 iOS safe area를 더한다.
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

.full-height-panel {
  // 주소창 크기가 변하는 모바일 브라우저에서 100vh로 생기는 하단 잘림을 피한다.
  min-height: 100dvh;
}
```

safe-area, scrollbar, viewport 단위는 대응하는 실제 기기 동작을 기록한다.

## 복잡한 selector와 specificity

```scss
.legacy-form :where(.field-error) {
  // 서버가 생성하는 중첩 깊이가 일정하지 않아 specificity를 늘리지 않는 하위 탐색을 사용한다.
  color: var(--color-danger);
}
```

복잡한 selector에는 대상 DOM을 제어할 수 없는 이유와 의도한 specificity를 설명한다.

## 그대로 복제하지 않을 것

- 확인하지 않은 브라우저·기기·외부 위젯 동작
- 다른 레이아웃에 근거 없이 적용한 breakpoint, `z-index`, 계산식
- 프로젝트에 존재하지 않는 디자인 토큰과 stacking context
- 일반 색상·간격·정렬·hover 결과를 코드 그대로 풀이한 주석
