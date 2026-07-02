/**
 * Toolbar.tsx — 도구 상단 바. 화면 전환 / 뷰포트 / 라이트·다크 / 전체화면 / 선택 내보내기.
 * 이 컨트롤들은 도구 셸 색(--sh-*)만 쓰고 후보 미리보기에 영향을 주지 않는다.
 */

import { SCREEN_LABELS, SCREEN_ORDER } from "../types";
import type { ColorMode, ScreenKey, Viewport } from "../types";

const VIEWPORTS: { key: Viewport; label: string }[] = [
  { key: "desktop", label: "데스크톱" },
  { key: "tablet", label: "태블릿" },
  { key: "mobile", label: "모바일" },
];

interface Props {
  screen: ScreenKey;
  onScreen: (s: ScreenKey) => void;
  viewport: Viewport;
  onViewport: (v: Viewport) => void;
  mode: ColorMode;
  onMode: (m: ColorMode) => void;
  fullscreen: boolean;
  onFullscreen: (v: boolean) => void;
  onExport: () => void;
}

export function Toolbar({
  screen,
  onScreen,
  viewport,
  onViewport,
  mode,
  onMode,
  fullscreen,
  onFullscreen,
  onExport,
}: Props) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        디자인 후보 비교
        <small>동일 콘텐츠 · 디자인만 다름</small>
      </div>

      <div className="toolbar__group" role="group" aria-label="화면 전환">
        <span className="toolbar__group-label">화면</span>
        <div className="sh-seg">
          {SCREEN_ORDER.map((s) => (
            <button
              key={s}
              className="sh-seg__opt"
              aria-pressed={screen === s}
              onClick={() => onScreen(s)}
              type="button"
            >
              {SCREEN_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar__group" role="group" aria-label="뷰포트">
        <span className="toolbar__group-label">뷰포트</span>
        <div className="sh-seg">
          {VIEWPORTS.map((v) => (
            <button
              key={v.key}
              className="sh-seg__opt"
              aria-pressed={viewport === v.key}
              onClick={() => onViewport(v.key)}
              type="button"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar__spacer" />

      <button
        className="sh-btn"
        aria-pressed={mode === "dark"}
        onClick={() => onMode(mode === "dark" ? "light" : "dark")}
        type="button"
        title="라이트/다크 전환"
      >
        {mode === "dark" ? "다크" : "라이트"}
      </button>

      <button
        className="sh-btn"
        aria-pressed={fullscreen}
        onClick={() => onFullscreen(!fullscreen)}
        type="button"
        title="미리보기 전체화면"
      >
        {fullscreen ? "패널 보기" : "전체화면"}
      </button>

      <button className="sh-btn sh-btn--primary" onClick={onExport} type="button">
        선택 내보내기
      </button>
    </header>
  );
}
