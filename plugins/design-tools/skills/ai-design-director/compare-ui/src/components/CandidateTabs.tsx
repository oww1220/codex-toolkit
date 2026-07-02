/**
 * CandidateTabs.tsx — 후보 A/B/C/D/E 탭 전환 + 나란히 보기(side-by-side) 토글.
 */

import type { Candidate, CandidateId, CompareMode } from "../types";

interface Props {
  candidates: Candidate[];
  active: CandidateId;
  onActive: (id: CandidateId) => void;
  compareMode: CompareMode;
  onCompareMode: (m: CompareMode) => void;
}

export function CandidateTabs({
  candidates,
  active,
  onActive,
  compareMode,
  onCompareMode,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 18px",
        borderBottom: "1px solid var(--sh-line)",
        background: "var(--sh-bg)",
        flexWrap: "wrap",
      }}
    >
      <div className="tabs" role="tablist" aria-label="후보 선택">
        {candidates.map((c, i) => (
          <button
            key={c.id}
            className="sh-tab"
            role="tab"
            aria-selected={compareMode === "single" && active === c.id}
            onClick={() => {
              onActive(c.id);
              if (compareMode !== "single") onCompareMode("single");
            }}
            type="button"
          >
            <small>후보 {String.fromCharCode(65 + i)}</small>
            <strong>{c.name}</strong>
          </button>
        ))}
      </div>

      <span style={{ flex: 1 }} />

      <div className="sh-seg" role="group" aria-label="비교 방식">
        <button
          className="sh-seg__opt"
          aria-pressed={compareMode === "single"}
          onClick={() => onCompareMode("single")}
          type="button"
        >
          단일 보기
        </button>
        <button
          className="sh-seg__opt"
          aria-pressed={compareMode === "sideBySide"}
          onClick={() => onCompareMode("sideBySide")}
          type="button"
        >
          나란히 보기
        </button>
      </div>
    </div>
  );
}
