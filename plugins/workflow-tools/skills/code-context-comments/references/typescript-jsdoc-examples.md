# 읽기 쉬운 TypeScript/JSDoc 예시

JavaScript, TypeScript, TSX에서 공통으로 참고한다. 타입과 코드를 문장으로 반복하지 말고, 호출 계약과 숨은 상태 변화만 설명한다.

## 비동기 함수와 내부 흐름

```ts
type PendingSocialLink = {
  provider: string
  externalUserId: string
}

/**
 * 가입 전에 세션에 남은 소셜 계정 정보를 현재 회원에게 연결한다.
 *
 * 대기 정보가 없거나 저장에 실패해도 완료된 회원가입은 되돌리지 않는다.
 * 저장에 성공한 경우에만 일회성 세션 값을 제거한다.
 *
 * @param session 연동 대기 정보를 조회하고 제거할 사용자 세션
 * @param memberId 소셜 계정을 연결할 가입 완료 회원 ID
 */
export async function completeSocialLink(
  session: Session,
  memberId: string,
): Promise<void> {
  // 소셜 로그인에서 회원가입으로 넘어올 때만 존재하는 일회성 연동 정보다.
  const pendingLink = session.get<PendingSocialLink>('pendingSocialLink')

  // 일반 회원가입처럼 연동할 계정이 없는 경우는 정상 흐름이다.
  if (!pendingLink) return

  try {
    await socialLinkRepository.save({
      memberId,
      provider: pendingLink.provider,
      externalUserId: pendingLink.externalUserId,
    })

    // 저장 전에 제거하면 실패 시 다시 연결할 정보를 잃는다.
    session.delete('pendingSocialLink')
  } catch (error) {
    // 부가 작업 실패가 회원가입 성공까지 실패로 바꾸지 않게 격리한다.
    logger.warn({ error, memberId }, 'social link registration failed')
  }
}
```

### 가독성이 좋은 이유

- JSDoc에 함수 책임, 정상적인 조기 종료, 실패 격리 정책을 모았다.
- `pendingLink`는 값의 출처와 수명이 숨겨져 있어 선언 가까이에 설명했다.
- 저장 후 세션 삭제 순서는 데이터 손실과 연결되므로 이유를 남겼다.
- `memberId`, `error`, 객체 속성처럼 이름과 타입으로 충분한 값은 반복 설명하지 않았다.

## TSX 컴포넌트 계약

```tsx
import { useEffect, useRef, useState } from 'react'

type SocialLinkNoticeProps = {
  /** 제공자 코드가 아니라 화면 제목에 표시할 사용자 친화적 이름. */
  providerName: string
  /** 제공자가 돌려준 마스킹 계정 정보. 제공 거부·미제공이면 null이다. */
  maskedAccount: string | null
  /** 사용자가 동의했을 때 호출하며, 상위 연동 처리가 끝나면 완료된다. */
  onContinue: () => Promise<void>
}

/**
 * 기존 회원에게 소셜 계정 연동 대상을 확인시키고 동의 이벤트를 전달한다.
 *
 * OAuth 요청이나 연동 저장은 상위 흐름이 담당하며 이 컴포넌트는 시작하지 않는다.
 */
export function SocialLinkNotice({
  providerName,
  maskedAccount,
  onContinue,
}: SocialLinkNoticeProps) {
  /** 상위 연동 처리 중 버튼을 비활성화하는 화면 상태다. */
  const [isContinuing, setIsContinuing] = useState(false)

  /** 상태가 다시 렌더되기 전 연속 클릭까지 즉시 차단하는 동기 가드다. */
  const isContinuingRef = useRef(false)

  const accountLabel = maskedAccount ?? '계정 정보 제공 안 됨'

  /** 제공자별 화면 제목을 반영하고 effect가 끝나면 이전 문서 제목을 복원한다. */
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${providerName} 계정 연결`

    return () => {
      document.title = previousTitle
    }
  }, [providerName])

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
- 모든 공개 props는 표시 용도, `null` 의미, 호출 시점을 선언 위치에 설명했다.
- `useState`는 화면 영향, `useRef`는 다시 렌더되기 전 필요한 동기 가드라는 목적을 적었다.
- `useEffect`는 문서 제목 변경과 cleanup의 복원 책임을 함께 설명했다.
- 파생 표시값과 JSX 구조는 코드만으로 충분해 주석을 붙이지 않았다.

## 그대로 복제하지 않을 것

- 타입 이름과 반환형을 되풀이하는 JSDoc
- props 타입과 이름만 문장으로 반복하는 형식적 주석
- JSX 태그 구조를 한국어로 옮긴 설명
- 실제 호출자에서 확인하지 않은 캐시 갱신·화면 이동·재시도 정책
