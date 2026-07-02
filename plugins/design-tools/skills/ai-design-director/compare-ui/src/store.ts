/**
 * store.ts — 선택 상태 훅. LocalStorage 영속 + selection.json 직렬화/다운로드 export.
 *
 * 결과 형태는 schemas/selection.schema.json 과 정확히 정합한다:
 *   selectedCandidate / combinedSelection(15요소) / likes / dislikes / notes / approvedAt
 *
 * approvedAt 은 이 단계에서 항상 빈 문자열로 둔다 — 확정은 다음 단계(/design-select)의 몫이다.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  CandidateId,
  CombinedSelection,
  ElementKey,
  FeedbackEntry,
  Selection,
} from "./types";

const STORAGE_KEY = "design-director:selection";

export function emptySelection(): Selection {
  return {
    selectedCandidate: null,
    combinedSelection: {},
    likes: [],
    dislikes: [],
    notes: "",
    approvedAt: "",
  };
}

function loadSelection(): Selection {
  if (typeof window === "undefined") return emptySelection();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySelection();
    const parsed = JSON.parse(raw) as Partial<Selection>;
    return { ...emptySelection(), ...parsed };
  } catch {
    return emptySelection();
  }
}

/** likes/dislikes 에서 동일 (candidate, element) 항목을 찾는다. */
function findFeedbackIndex(
  list: FeedbackEntry[],
  candidate: CandidateId,
  element: ElementKey,
): number {
  return list.findIndex((e) => e.candidate === candidate && e.element === element);
}

export interface SelectionStore {
  selection: Selection;
  /** 단일 후보 전체 선택 토글. 같은 후보를 다시 누르면 해제(null). */
  toggleSelectedCandidate: (id: CandidateId) => void;
  /** 요소 단위 조합 선택 — 해당 요소를 어느 후보에서 가져올지 지정. 같은 값 재선택 시 해제. */
  setCombinedElement: (element: ElementKey, candidate: CandidateId | null) => void;
  /** 좋아요 토글 (메모 포함). 같은 (후보,요소)면 해제. dislike 와 상호배타. */
  toggleLike: (candidate: CandidateId, element: ElementKey, note?: string) => void;
  /** 싫어요 토글. */
  toggleDislike: (candidate: CandidateId, element: ElementKey, note?: string) => void;
  /** 특정 (후보,요소) 의 좋아요/싫어요 메모 갱신. */
  setFeedbackNote: (
    kind: "like" | "dislike",
    candidate: CandidateId,
    element: ElementKey,
    note: string,
  ) => void;
  /** 전반 메모 갱신. */
  setNotes: (notes: string) => void;
  /** 전체 초기화. */
  reset: () => void;
  /** selection.json 으로 직렬화한 문자열. */
  serialize: () => string;
  /** 브라우저에서 selection.json 다운로드. */
  exportSelection: () => void;
  /** 특정 (후보,요소) 의 현재 피드백 상태. */
  feedbackOf: (
    candidate: CandidateId,
    element: ElementKey,
  ) => "like" | "dislike" | null;
}

export function useSelectionStore(): SelectionStore {
  const [selection, setSelection] = useState<Selection>(loadSelection);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch {
      // 저장 실패는 조용히 무시 (프라이빗 모드 등) — 상태는 메모리에 유지된다.
    }
  }, [selection]);

  const toggleSelectedCandidate = useCallback((id: CandidateId) => {
    setSelection((prev) => ({
      ...prev,
      selectedCandidate: prev.selectedCandidate === id ? null : id,
    }));
  }, []);

  const setCombinedElement = useCallback(
    (element: ElementKey, candidate: CandidateId | null) => {
      setSelection((prev) => {
        const next: CombinedSelection = { ...prev.combinedSelection };
        if (candidate === null || next[element] === candidate) {
          delete next[element];
        } else {
          next[element] = candidate;
        }
        return { ...prev, combinedSelection: next };
      });
    },
    [],
  );

  const toggleFeedback = useCallback(
    (kind: "like" | "dislike", candidate: CandidateId, element: ElementKey, note = "") => {
      setSelection((prev) => {
        const sameKey: keyof Selection = kind === "like" ? "likes" : "dislikes";
        const otherKey: keyof Selection = kind === "like" ? "dislikes" : "likes";
        const sameList = [...(prev[sameKey] as FeedbackEntry[])];
        const otherList = [...(prev[otherKey] as FeedbackEntry[])];

        const sameIdx = findFeedbackIndex(sameList, candidate, element);
        if (sameIdx >= 0) {
          // 이미 같은 종류로 선택돼 있으면 해제(토글).
          sameList.splice(sameIdx, 1);
        } else {
          sameList.push({ candidate, element, note });
          // 상호배타: 반대 종류에 같은 항목 있으면 제거.
          const otherIdx = findFeedbackIndex(otherList, candidate, element);
          if (otherIdx >= 0) otherList.splice(otherIdx, 1);
        }
        return { ...prev, [sameKey]: sameList, [otherKey]: otherList };
      });
    },
    [],
  );

  const toggleLike = useCallback(
    (candidate: CandidateId, element: ElementKey, note?: string) =>
      toggleFeedback("like", candidate, element, note),
    [toggleFeedback],
  );

  const toggleDislike = useCallback(
    (candidate: CandidateId, element: ElementKey, note?: string) =>
      toggleFeedback("dislike", candidate, element, note),
    [toggleFeedback],
  );

  const setFeedbackNote = useCallback(
    (kind: "like" | "dislike", candidate: CandidateId, element: ElementKey, note: string) => {
      setSelection((prev) => {
        const key: keyof Selection = kind === "like" ? "likes" : "dislikes";
        const list = [...(prev[key] as FeedbackEntry[])];
        const idx = findFeedbackIndex(list, candidate, element);
        if (idx >= 0) {
          list[idx] = { ...list[idx], note };
        } else {
          list.push({ candidate, element, note });
        }
        return { ...prev, [key]: list };
      });
    },
    [],
  );

  const setNotes = useCallback((notes: string) => {
    setSelection((prev) => ({ ...prev, notes }));
  }, []);

  const reset = useCallback(() => setSelection(emptySelection()), []);

  const serialize = useCallback(() => {
    // 키 순서를 스키마 §4.3 순서로 고정해 export 결과를 안정적으로 둔다.
    const ordered: Selection = {
      selectedCandidate: selection.selectedCandidate,
      combinedSelection: selection.combinedSelection,
      likes: selection.likes,
      dislikes: selection.dislikes,
      notes: selection.notes,
      approvedAt: "", // 이 단계에서는 항상 빈 문자열 — 자동 확정 금지.
    };
    return JSON.stringify(ordered, null, 2);
  }, [selection]);

  const exportSelection = useCallback(() => {
    if (typeof window === "undefined") return;
    const blob = new Blob([serialize()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selection.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [serialize]);

  const feedbackOf = useCallback(
    (candidate: CandidateId, element: ElementKey): "like" | "dislike" | null => {
      if (findFeedbackIndex(selection.likes, candidate, element) >= 0) return "like";
      if (findFeedbackIndex(selection.dislikes, candidate, element) >= 0) return "dislike";
      return null;
    },
    [selection.likes, selection.dislikes],
  );

  return {
    selection,
    toggleSelectedCandidate,
    setCombinedElement,
    toggleLike,
    toggleDislike,
    setFeedbackNote,
    setNotes,
    reset,
    serialize,
    exportSelection,
    feedbackOf,
  };
}
