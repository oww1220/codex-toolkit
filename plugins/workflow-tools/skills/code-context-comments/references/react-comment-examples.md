# 읽기 쉬운 React 주석 예시

React 훅과 TSX 컴포넌트의 공개 계약, 상태, 파생값, effect, 이벤트 분기를 설명할 때 참고한다.

## 필수 적용 범위

- 컴포넌트·custom hook·공유 props/options/type의 역할과 모든 `props.*`·반환 계약
- 모든 `useState`·`useReducer`·`useRef`·Context 상태의 목적, UI 영향, 갱신 조건과 주체
- Redux·Zustand의 모든 state·selector·action·setter·dispatch와 전역 상태 변경 영향
- 모든 파생값·`useMemo`, handler·`useCallback`, `useEffect`·구독·cleanup의 입력과 실행 조건
- 모든 이벤트 handler, 조건·조기 반환·삼항식·switch·반복·catch/finally 경로
- JSX 조건부 렌더링·목록·빈 상태의 각 화면 경로와 접근성·사용자 행동 영향

대상 코드에 존재하는 항목은 모두 점검 목록에 넣고 선언 또는 실행 경로 가까이에 설명한다.

## 객체 옵션을 받는 훅 계약

```ts
import { useState } from 'react'

/** 삭제 확인과 실행 흐름을 조율하는 hook 의존성 계약이다. */
type DailyChallengeDeletionOptions = {
  mutations: DailyChallengeMutations
  selectedChallenge: DailyChallenge
  setSelectedChallengeId: (id: string | null) => void
  showToast: (message: string) => void
}

/**
 * 선택한 챌린지의 삭제 확인 창과 삭제 요청을 관리한다.
 *
 * @param options 훅이 삭제 흐름을 조율하는 데 사용하는 의존성.
 * @param options.mutations 삭제 요청과 진행 상태를 제공하는 챌린지 mutation 집합.
 * @param options.selectedChallenge 삭제 대상 ID와 성공 문구의 기준이 되는 현재 선택 챌린지.
 * @param options.setSelectedChallengeId 삭제 성공 후 상세 패널 선택을 비우는 callback.
 * @param options.showToast 삭제 성공·실패 문구를 화면 snackbar에 전달하는 callback.
 * @returns 확인 창의 열림 상태·설정 함수와 삭제 실행 함수.
 */
export function useDailyChallengeDeletion(
  options: DailyChallengeDeletionOptions,
) {
  const {
    mutations,
    selectedChallenge,
    setSelectedChallengeId,
    showToast,
  } = options

  /** 삭제 확인 창의 표시 여부를 제어한다. */
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  /**
   * 선택한 챌린지를 삭제하고 성공한 경우에만 선택과 확인 창을 초기화한다.
   * @returns 삭제 요청과 성공·실패 화면 처리가 끝나면 완료되는 작업.
   */
  async function deleteSelectedChallenge() {
    try {
      await mutations.remove(selectedChallenge.id)
      setSelectedChallengeId(null)
      setIsDeleteDialogOpen(false)
      showToast(`${selectedChallenge.title} 챌린지를 삭제했습니다.`)
    } catch {
      // 실패 시 선택과 확인 창을 유지해 사용자가 같은 대상을 다시 시도하게 한다.
      showToast('챌린지를 삭제하지 못했습니다.')
    }
  }

  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteSelectedChallenge,
  }
}
```

### 가독성이 좋은 이유

- 훅의 책임과 중첩된 `options.*` 계약을 선언부 한곳에서 찾을 수 있다.
- 상태와 내부 실행 함수에는 UI 영향과 성공·실패 후 유지할 상태를 설명했다.
- 타입만 반복하거나 반환 객체의 속성을 다시 나열하지 않았다.

## TSX 컴포넌트 계약

```tsx
import { useEffect, useRef, useState } from 'react'

/** 연동 동의 화면이 표시하고 상위 흐름에 전달할 입력 계약이다. */
type SocialLinkNoticeProps = {
  providerName: string
  maskedAccount: string | null
  onContinue: () => Promise<void>
}

/**
 * 기존 회원에게 소셜 계정 연동 대상을 확인시키고 동의 이벤트를 전달한다.
 *
 * OAuth 요청이나 연동 저장은 상위 흐름이 담당하며 이 컴포넌트는 시작하지 않는다.
 *
 * @param props 컴포넌트가 표시와 이벤트 전달에 사용하는 입력값.
 * @param props.providerName 제공자 코드가 아니라 화면 제목에 표시할 사용자 친화적 이름.
 * @param props.maskedAccount 제공자가 돌려준 마스킹 계정 정보. 제공 거부·미제공이면 null.
 * @param props.onContinue 사용자가 동의했을 때 호출하며, 상위 연동 처리가 끝나면 완료되는 callback.
 * @returns 연동 대상 계정과 진행 상태를 보여주고 동의 이벤트를 전달하는 화면.
 */
export function SocialLinkNotice(props: SocialLinkNoticeProps) {
  const { providerName, maskedAccount, onContinue } = props

  /** 상위 연동 처리 중 버튼을 비활성화하는 화면 상태다. */
  const [isContinuing, setIsContinuing] = useState(false)

  /** 상태가 다시 렌더되기 전 연속 클릭까지 즉시 차단하는 동기 가드다. */
  const isContinuingRef = useRef(false)

  /** 제공자 계정 정보가 없을 때 사용할 화면 표시값까지 결정한다. */
  const accountLabel = maskedAccount ?? '계정 정보 제공 안 됨'

  /** 제공자별 화면 제목을 반영하고 effect가 끝나면 이전 문서 제목을 복원한다. */
  useEffect(() => {
    // cleanup에서 원래 화면 제목을 복원하기 위해 effect 실행 전 값을 보관한다.
    const previousTitle = document.title
    document.title = `${providerName} 계정 연결`

    return () => {
      document.title = previousTitle
    }
  }, [providerName])

  /**
   * 연속 클릭을 차단한 상태로 상위 연동 작업을 실행하고 완료 후 진행 상태를 복구한다.
   * @returns 상위 연동 작업과 상태 복구가 끝나면 완료되는 작업.
   */
  async function handleContinue() {
    // 상태 반영 전 들어온 연속 클릭도 같은 연동 요청을 다시 만들지 않게 종료한다.
    if (isContinuingRef.current) return

    isContinuingRef.current = true
    setIsContinuing(true)

    try {
      await onContinue()
    } finally {
      // 성공·실패와 관계없이 연속 클릭 가드를 풀고 오류는 호출자에게 전파한다.
      isContinuingRef.current = false
      setIsContinuing(false)
    }
  }

  return (
    <section aria-labelledby="social-link-title">
      <h2 id="social-link-title">{providerName} 계정 연결</h2>
      <p>{accountLabel}</p>
      {/* 클릭 Promise는 이 화면에서 기다리지 않고 handler 내부 진행 상태로 중복 실행을 막는다. */}
      <button
        type="button"
        disabled={isContinuing}
        onClick={() => void handleContinue()}
      >
        연결하고 계속하기
      </button>
    </section>
  )
}
```

### 가독성이 좋은 이유

- 컴포넌트가 표시와 이벤트 전달만 담당한다는 경계를 선언부에 적었다.
- 모든 공개 props와 반환 화면의 계약을 컴포넌트 JSDoc에 모았다.
- `useState`는 UI 영향, `useRef`는 다시 렌더되기 전 필요한 동기 가드라는 목적을 적었다.
- `useEffect`는 실행 조건, 문서 제목 변경, cleanup의 복원 책임을 함께 설명했다.

## Redux·Zustand store 정의 계약

```ts
/** 목록·상세 패널이 공유하는 Redux 챌린지 선택 상태다. */
type ChallengeState = {
  /** 목록과 상세 패널이 공유하는 선택 챌린지. 선택이 없으면 null이다. */
  selectedChallengeId: string | null
}

/** 화면 진입 시 어떤 챌린지도 선택하지 않은 전역 초기 상태다. */
const initialState: ChallengeState = {
  selectedChallengeId: null,
}

/** 챌린지 선택 상태와 그 상태를 바꾸는 Redux action을 소유한다. */
export const challengeSlice = createSlice({
  name: 'challenge',
  initialState,
  reducers: {
    /**
     * 사용자가 고른 챌린지를 전역 선택으로 저장해 상세 패널을 함께 갱신한다.
     * @param state 현재 전역 선택을 변경할 Redux draft 상태.
     * @param action 새로 선택한 챌린지 ID를 담은 action.
     */
    challengeSelected(state, action: PayloadAction<string>) {
      state.selectedChallengeId = action.payload
    },
  },
})

/** 목록 화면 사이에서 공유할 Zustand 필터 상태와 갱신 계약이다. */
type ChallengeFilterStore = {
  /** 여러 목록 화면이 공유하며 조회 조건과 빈 상태 문구를 함께 바꾸는 필터다. */
  filter: ChallengeFilter
  /** 새 필터를 저장해 구독 중인 목록 화면을 다시 계산하게 한다. */
  setFilter: (filter: ChallengeFilter) => void
}

/** 챌린지 목록 사이에서 유지할 필터와 갱신 action을 구독하는 hook을 제공한다. */
export const useChallengeStore = create<ChallengeFilterStore>((set) => ({
  /** 최초 진입에서는 모든 챌린지를 표시한다. */
  filter: 'all',
  /** 전달된 필터만 교체하고 목록 계산은 각 selector에 맡긴다. */
  setFilter: (filter) => set({ filter }),
}))
```

- Redux state와 reducer에는 공유 상태의 의미와 dispatch 후 영향을 설명한다.
- Zustand state·setter에는 구독 화면과 파생값에 생기는 변화를 설명한다.

## 파생값·callback·스토어와 JSX 경로

```tsx
/**
 * 회원과 전역 필터에 맞는 챌린지 목록을 표시하고 선택을 상세 패널에 전달한다.
 * @returns 필터 결과에 따른 빈 상태 또는 선택 가능한 챌린지 목록.
 */
export function ChallengeList() {
  /** 로그인 회원이 볼 수 있는 챌린지로 selector 입력을 제한한다. */
  const memberId = useAppSelector((state) => state.session.memberId)

  /** 목록 조회를 다시 실행할 Redux action을 전달한다. */
  const dispatch = useAppDispatch()

  /** 여러 화면이 공유하는 목록 필터이며 변경 시 목록·건수 표시가 함께 바뀐다. */
  const filter = useChallengeStore((state) => state.filter)

  /** 사용자가 필터를 선택했을 때 Zustand 전역 상태를 갱신한다. */
  const setFilter = useChallengeStore((state) => state.setFilter)

  /** 회원 범위와 전역 필터를 모두 적용한 실제 렌더링 목록이다. */
  const visibleChallenges = useMemo(
    () => selectVisibleChallenges(memberId, filter),
    [memberId, filter],
  )

  /**
   * 선택 항목을 전역 상태에 저장해 목록과 상세 패널의 선택을 동기화한다.
   * @param challengeId 사용자가 목록에서 선택한 챌린지 ID.
   */
  const handleSelect = useCallback(
    (challengeId: string) => {
      dispatch(challengeSelected(challengeId))
    },
    [dispatch],
  )

  /**
   * 필터 변경은 이후 조회와 화면 표시가 같은 조건을 사용하도록 store action으로 모은다.
   * @param nextFilter 사용자가 선택한 다음 목록 필터.
   */
  function handleFilterChange(nextFilter: ChallengeFilter) {
    setFilter(nextFilter)
  }

  return visibleChallenges.length === 0 ? (
    <>
      {/* 조회가 끝났지만 항목이 없는 경로이며 재설정은 전역 필터를 all로 돌린다. */}
      <ChallengeEmptyState onReset={() => handleFilterChange('all')} />
    </>
  ) : (
    <>
      {/* 필터가 적용된 목록만 렌더링하며 선택은 상세 패널과 공유한다. */}
      {visibleChallenges.map((challenge) => (
        <ChallengeRow
          key={challenge.id}
          challenge={challenge}
          onPress={handleSelect}
        />
      ))}
    </>
  )
}
```

- selector·dispatch·setter는 API 이름이 아니라 읽고 바꾸는 전역 상태와 영향 범위를 설명한다.
- `useMemo`·`useCallback`은 의존성 배열을 반복하지 않고 파생 정책과 호출 결과를 설명한다.
- 삼항식 양쪽과 목록 반복은 각 화면 경로가 의미하는 상태와 사용자 행동을 남긴다.

## 그대로 복제하지 않을 것

- props 타입과 이름만 문장으로 반복하는 형식적 주석
- JSX 태그 구조를 한국어로 옮긴 설명
- 실제 호출자에서 확인하지 않은 캐시 갱신·화면 이동·재시도 정책
