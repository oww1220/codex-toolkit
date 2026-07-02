/**
 * App.tsx — 비교 도구의 루트.
 *
 * 데이터는 public/data/{content.json, candidates.json} 에서 fetch 한다(커맨드가 교체하는 자리).
 * 상태: 활성 후보 / 화면 / 뷰포트 / 라이트·다크 / 단일·나란히 / 전체화면 + 선택 store.
 *
 * 불변식: 모든 후보는 같은 content 를 쓰고 candidates 의 토큰만 다르다.
 */

import { useEffect, useMemo, useState } from "react";
import { Toolbar } from "./components/Toolbar";
import { CandidateTabs } from "./components/CandidateTabs";
import { ViewportFrame } from "./components/ViewportFrame";
import { SideBySide } from "./components/SideBySide";
import { SelectionPanel } from "./components/SelectionPanel";
import { ElementPicker } from "./components/ElementPicker";
import { useSelectionStore } from "./store";
import type {
  Candidate,
  CandidateId,
  CandidatesFile,
  ColorMode,
  CompareMode,
  Content,
  ScreenKey,
  Viewport,
} from "./types";

// base: "./" 이므로 데이터도 상대 경로로 가져온다(임의 경로 정적 서빙 호환).
const DATA_BASE = `${import.meta.env.BASE_URL}data`;

interface LoadState {
  content: Content | null;
  candidates: Candidate[];
  error: string | null;
  loading: boolean;
}

export function App() {
  const [data, setData] = useState<LoadState>({
    content: null,
    candidates: [],
    error: null,
    loading: true,
  });

  const [activeId, setActiveId] = useState<CandidateId>("candidate-a");
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [mode, setMode] = useState<ColorMode>("light");
  const [compareMode, setCompareMode] = useState<CompareMode>("single");
  const [fullscreen, setFullscreen] = useState(false);

  const store = useSelectionStore();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${DATA_BASE}/content.json`).then((r) => {
        if (!r.ok) throw new Error("content.json 을 불러오지 못했습니다.");
        return r.json() as Promise<Content>;
      }),
      fetch(`${DATA_BASE}/candidates.json`).then((r) => {
        if (!r.ok) throw new Error("candidates.json 을 불러오지 못했습니다.");
        return r.json() as Promise<CandidatesFile>;
      }),
    ])
      .then(([content, candFile]) => {
        if (cancelled) return;
        const candidates = candFile.candidates ?? [];
        setData({ content, candidates, error: null, loading: false });
        if (candidates.length > 0) setActiveId(candidates[0].id);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData({
          content: null,
          candidates: [],
          error: err instanceof Error ? err.message : "데이터 로드 실패",
          loading: false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = useMemo(
    () => data.candidates.find((c) => c.id === activeId) ?? data.candidates[0],
    [data.candidates, activeId],
  );

  if (data.loading) {
    return <div className="empty">데이터를 불러오는 중…</div>;
  }
  if (data.error || !data.content || data.candidates.length === 0 || !active) {
    return (
      <div className="empty">
        {data.error ?? "비교할 후보가 없습니다."}
        <br />
        <code>public/data/content.json</code> · <code>public/data/candidates.json</code> 을
        확인하세요.
      </div>
    );
  }

  const content = data.content;

  return (
    <div className="app">
      <Toolbar
        screen={screen}
        onScreen={setScreen}
        viewport={viewport}
        onViewport={setViewport}
        mode={mode}
        onMode={setMode}
        fullscreen={fullscreen}
        onFullscreen={setFullscreen}
        onExport={store.exportSelection}
      />

      <CandidateTabs
        candidates={data.candidates}
        active={active.id}
        onActive={setActiveId}
        compareMode={compareMode}
        onCompareMode={setCompareMode}
      />

      <div
        className="app__body"
        style={fullscreen ? { gridTemplateColumns: "1fr" } : undefined}
      >
        <div className="app__stage">
          {compareMode === "sideBySide" ? (
            <SideBySide
              candidates={data.candidates}
              content={content}
              screen={screen}
              viewport={viewport}
              mode={mode}
            />
          ) : (
            <div className="stage__row">
              <ViewportFrame
                candidate={active}
                content={content}
                screen={screen}
                viewport={viewport}
                mode={mode}
                fit={viewport === "desktop"}
              />
            </div>
          )}
        </div>

        {!fullscreen && (
          <aside className="app__side" aria-label="선택 패널">
            <SelectionPanel candidate={active} candidates={data.candidates} store={store} />
            <ElementPicker candidate={active} candidates={data.candidates} store={store} />
          </aside>
        )}
      </div>
    </div>
  );
}
