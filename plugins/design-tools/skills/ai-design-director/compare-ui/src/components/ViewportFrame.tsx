/**
 * ViewportFrame.tsx — 한 후보의 한 화면을 특정 뷰포트 폭으로 그리는 미리보기 프레임.
 *
 * 핵심: candidateToCssVars(candidate, mode) 로 만든 --dd-* 변수를 프레임 root 에 주입하면,
 * 안의 화면 컴포넌트는 토큰만으로 그 후보의 디자인을 표현한다. 셸 색은 여기로 새지 않는다.
 */

import { candidateToCssVars } from "../theme";
import "../screens/screens.css";
import { Dashboard } from "../screens/Dashboard";
import { ListView } from "../screens/ListView";
import { DetailView } from "../screens/DetailView";
import { FormView } from "../screens/FormView";
import { SCREEN_LABELS } from "../types";
import type {
  Candidate,
  ColorMode,
  Content,
  ScreenKey,
  Viewport,
} from "../types";

const VIEWPORT_WIDTH: Record<Viewport, number> = {
  desktop: 1160,
  tablet: 760,
  mobile: 390,
};

const VIEWPORT_HEIGHT: Record<Viewport, number> = {
  desktop: 720,
  tablet: 680,
  mobile: 720,
};

function ScreenSwitch({
  screen,
  content,
  candidate,
}: {
  screen: ScreenKey;
  content: Content;
  candidate: Candidate;
}) {
  switch (screen) {
    case "dashboard":
      return <Dashboard content={content} candidate={candidate} />;
    case "list":
      return <ListView content={content} candidate={candidate} />;
    case "detail":
      return <DetailView content={content} candidate={candidate} />;
    case "form":
      return <FormView content={content} candidate={candidate} />;
    default:
      return null;
  }
}

interface Props {
  candidate: Candidate;
  content: Content;
  screen: ScreenKey;
  viewport: Viewport;
  mode: ColorMode;
  /** 프레임 위 라벨에 후보명을 보일지(나란히 보기에서 유용). */
  showLabel?: boolean;
  /** 프레임 폭을 부모 폭에 맞춰 줄일지(단일 보기). */
  fit?: boolean;
}

export function ViewportFrame({
  candidate,
  content,
  screen,
  viewport,
  mode,
  showLabel = true,
  fit = false,
}: Props) {
  const vars = candidateToCssVars(candidate, mode);
  const width = VIEWPORT_WIDTH[viewport];
  const height = VIEWPORT_HEIGHT[viewport];

  return (
    <div className="frame" style={{ width: fit ? "100%" : width, maxWidth: width }}>
      {showLabel && (
        <div className="frame__bar">
          <span className="frame__dot" />
          <strong>{candidate.name}</strong>
          <span style={{ opacity: 0.7 }}>· {SCREEN_LABELS[screen]}</span>
        </div>
      )}
      <div
        className="frame__viewport"
        style={{ ...vars, width: fit ? "100%" : width }}
        data-candidate={candidate.id}
      >
        <div className="frame__scroll" style={{ height }}>
          <div className="dd">
            <ScreenSwitch screen={screen} content={content} candidate={candidate} />
          </div>
        </div>
      </div>
    </div>
  );
}
