/**
 * ElementPicker.tsx — 요소 15종(고정) 각각에 대해:
 *   - 현재 후보 기준 좋아요/싫어요 (메모는 store 에 누적)
 *   - 조합 선택: 그 요소를 어느 후보에서 가져올지 지정 (combinedSelection)
 *
 * 15종은 schemas/selection.schema.json 의 element enum 과 1:1 정합한다.
 */

import { ELEMENT_KEYS, ELEMENT_LABELS } from "../types";
import type { Candidate, CandidateId, ElementKey } from "../types";
import type { SelectionStore } from "../store";

interface Props {
  /** 현재 활성 후보 — 좋아요/싫어요의 대상이 된다. */
  candidate: Candidate;
  candidates: Candidate[];
  store: SelectionStore;
}

export function ElementPicker({ candidate, candidates, store }: Props) {
  const { selection } = store;

  return (
    <section className="panel">
      <div className="picker__head">
        <h2 className="panel__title">요소별 선호 · 조합</h2>
        <span className="picker__hint">대상: {candidate.name}</span>
      </div>
      <p className="panel__sub">
        좋아요/싫어요는 <strong>{candidate.name}</strong> 기준입니다. 오른쪽 드롭다운으로 각 요소를
        어느 후보에서 가져올지 조합할 수 있습니다.
      </p>

      <div role="list">
        {ELEMENT_KEYS.map((el: ElementKey) => {
          const fb = store.feedbackOf(candidate.id, el);
          const assigned = selection.combinedSelection[el];
          return (
            <div className="elem" role="listitem" key={el}>
              <div>
                <div className="elem__name">{ELEMENT_LABELS[el]}</div>
                {assigned && (
                  <div className="elem__from">
                    ← {candidates.find((c) => c.id === assigned)?.name ?? assigned}
                  </div>
                )}
              </div>

              <div className="elem__btns">
                <button
                  className={"fb fb--like" + (fb === "like" ? " is-on" : "")}
                  aria-pressed={fb === "like"}
                  aria-label={`${ELEMENT_LABELS[el]} 좋아요`}
                  title="좋아요"
                  onClick={() => store.toggleLike(candidate.id, el)}
                  type="button"
                >
                  ↑
                </button>
                <button
                  className={"fb fb--dislike" + (fb === "dislike" ? " is-on" : "")}
                  aria-pressed={fb === "dislike"}
                  aria-label={`${ELEMENT_LABELS[el]} 싫어요`}
                  title="싫어요"
                  onClick={() => store.toggleDislike(candidate.id, el)}
                  type="button"
                >
                  ↓
                </button>
              </div>

              <select
                className="assign"
                aria-label={`${ELEMENT_LABELS[el]} 를 가져올 후보`}
                value={assigned ?? ""}
                onChange={(e) =>
                  store.setCombinedElement(
                    el,
                    e.target.value === "" ? null : (e.target.value as CandidateId),
                  )
                }
              >
                <option value="">조합 안 함</option>
                {candidates.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    {String.fromCharCode(65 + i)} · {c.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </section>
  );
}
