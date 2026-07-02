/**
 * SideBySide.tsx — 모든 후보를 같은 화면·같은 뷰포트로 나란히 깔아 *디자인만* 다름을 한눈에 본다.
 * 동일 조건 비교 불변식의 시각적 증거.
 */

import { ViewportFrame } from "./ViewportFrame";
import type { Candidate, ColorMode, Content, ScreenKey, Viewport } from "../types";

interface Props {
  candidates: Candidate[];
  content: Content;
  screen: ScreenKey;
  viewport: Viewport;
  mode: ColorMode;
}

export function SideBySide({ candidates, content, screen, viewport, mode }: Props) {
  return (
    <div className="stage__row">
      {candidates.map((c) => (
        <ViewportFrame
          key={c.id}
          candidate={c}
          content={content}
          screen={screen}
          viewport={viewport}
          mode={mode}
          showLabel
        />
      ))}
    </div>
  );
}
