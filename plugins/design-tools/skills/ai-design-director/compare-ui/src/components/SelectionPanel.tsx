/**
 * SelectionPanel.tsx — 현재(또는 활성) 후보의 설명·추천 이유·주의점 + 단일 후보 전체 선택.
 * 전반 메모 입력과 선택 요약도 함께 보여준다.
 */

import type { Candidate } from "../types";
import type { SelectionStore } from "../store";

interface Props {
  candidate: Candidate;
  candidates: Candidate[];
  store: SelectionStore;
}

export function SelectionPanel({ candidate, candidates, store }: Props) {
  const { selection } = store;
  const isSelected = selection.selectedCandidate === candidate.id;
  const combinedCount = Object.keys(selection.combinedSelection).length;

  return (
    <>
      <section className="panel">
        <h2 className="panel__title">{candidate.name}</h2>
        <div className="panel__kw">
          {candidate.keywords.map((k) => (
            <span className="kw" key={k}>
              {k}
            </span>
          ))}
        </div>
        <p className="panel__sub">{candidate.description}</p>

        <div className="panel__reason">{candidate.recommendReason}</div>

        <p className="panel__sub" style={{ margin: "10px 0 2px", fontWeight: 600 }}>
          어디에 맞나
        </p>
        <ul className="panel__list">
          {candidate.recommendedFor.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <p className="panel__sub" style={{ margin: "10px 0 2px", fontWeight: 600 }}>
          주의점
        </p>
        <ul className="panel__list">
          {candidate.risks.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <div className="choose-row">
          <button
            className={"sh-btn " + (isSelected ? "sh-btn--primary" : "")}
            aria-pressed={isSelected}
            onClick={() => store.toggleSelectedCandidate(candidate.id)}
            type="button"
          >
            {isSelected ? "이 후보 전체 선택됨" : "이 후보 전체 선택"}
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">전반 메모</h2>
        <textarea
          className="notes"
          value={selection.notes}
          onChange={(e) => store.setNotes(e.target.value)}
          placeholder="전반적으로 어떤 방향이 끌리는지, 무엇이 걸리는지 자유롭게 적어두세요."
          aria-label="전반 메모"
        />

        <p className="summary-line" style={{ marginTop: 12 }}>
          {selection.selectedCandidate ? (
            <>
              단일 선택:{" "}
              <code>
                {candidates.find((c) => c.id === selection.selectedCandidate)?.name ??
                  selection.selectedCandidate}
              </code>
            </>
          ) : combinedCount > 0 ? (
            <>
              조합 선택: <code>{combinedCount}/15</code> 요소 지정됨
            </>
          ) : (
            "아직 선택 없음 — 후보 전체를 고르거나, 아래에서 요소별로 조합하세요."
          )}
          <br />
          좋아요 <code>{selection.likes.length}</code> · 싫어요{" "}
          <code>{selection.dislikes.length}</code>
        </p>
      </section>
    </>
  );
}
