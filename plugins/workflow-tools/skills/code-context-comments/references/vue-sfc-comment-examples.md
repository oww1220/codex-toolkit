# 읽기 쉬운 Vue SFC 주석 예시

Vue 예시는 `<script setup>`의 컴포넌트 계약과 반응형 흐름에 집중한다. 일반 태그는 해설하지 않지만 조건·반복·이벤트 경로는 사용자 영향을 설명한다.

## 필수 적용 범위

- 컴포넌트·composable·Props/Emits의 역할과 모든 props·emit·반환 계약
- 모든 `ref`·`reactive`·template ref와 Pinia state·getter·action·setter의 목적·UI 영향·갱신 주체
- 모든 `computed`, handler, `watch`·`watchEffect`·구독·cleanup의 입력과 실행 조건
- 모든 조건·조기 반환·삼항식·switch·반복·catch/finally 경로
- template의 `v-if/v-else-if/v-else`, `v-for`, 빈 상태와 이벤트 경로의 사용자 영향

대상 코드에 존재하는 항목은 모두 점검 목록에 넣고 선언 또는 실행 경로 가까이에 설명한다.

## 연동 동의 컴포넌트

```vue
<script setup lang="ts">
/**
 * 기존 회원에게 연동 계정을 확인시키고 동의 결과를 상위 흐름에 전달한다.
 *
 * OAuth 인가와 저장 요청은 composable에 맡기며, 이 컴포넌트는 화면 상태만 관리한다.
 *
 * @param props 컴포넌트가 표시와 연동 요청에 사용하는 readonly 반응형 입력값.
 * @param props.memberId 연동 정보를 저장할 기존 회원 ID. 로그인 회원 판정 후 전달된다.
 * @param props.providerName 제공자 코드가 아니라 화면 제목에 표시할 사용자 친화적 이름.
 * @param props.maskedAccount 제공자가 돌려준 마스킹 계정 정보. 제공 거부·미제공이면 null.
 * @returns 연동 대상 계정과 진행 상태를 보여주고 완료 이벤트를 전달하는 화면.
 */
import { computed, nextTick, reactive, ref, watch } from 'vue'

import { useSocialLink } from '@/composables/useSocialLink'

/** 연동 동의 화면이 표시하고 저장 요청에 사용할 readonly 입력 계약이다. */
type Props = {
  memberId: string
  providerName: string
  maskedAccount: string | null
}

/** 상위 화면에서 전달한 연동 대상과 표시 정보를 읽는 readonly 반응형 입력값이다. */
const props = defineProps<Props>()

const emit = defineEmits<{
  /** 연동 저장이 끝나 상위 화면이 다음 단계로 이동해도 될 때 발생한다. */
  completed: []
}>()

/** 인증된 회원에게 제공자 계정을 연결하는 composable 작업이다. */
const { linkAccount } = useSocialLink()

/** 제출 시작부터 완료까지 함께 갱신되는 화면 상태다. */
const submission = reactive({
  /** 같은 계정의 중복 저장을 막고 제출 버튼의 비활성 상태를 결정한다. */
  isSubmitting: false,
  /** 사용자에게 보여줄 재시도 안내. 빈 문자열이면 오류 영역을 숨긴다. */
  errorMessage: '',
})

/** 오류 발생 후 메시지로 키보드 포커스를 옮기기 위한 DOM 참조다. */
const errorMessageRef = ref<HTMLParagraphElement | null>(null)

/** 제공자가 계정 정보를 주지 않은 경우 화면에 표시할 대체 문구까지 포함한다. */
const accountLabel = computed(
  () => props.maskedAccount ?? '계정 정보 제공 안 됨',
)

/** 회원 prop 변경을 화면 문맥 전환으로 보고 이전 회원의 오류 상태를 제거한다. */
watch(
  () => props.memberId,
  () => {
    submission.errorMessage = ''
  },
)

/**
 * 연속 제출을 차단하며 계정을 연결하고 성공 이벤트 또는 재시도 오류 상태를 만든다.
 * @returns 연결 요청과 성공·실패 후 화면 상태 갱신이 끝나면 완료되는 작업.
 */
async function submitConsent() {
  // 연속 클릭으로 같은 제공자 계정이 중복 저장되는 것을 막는다.
  if (submission.isSubmitting) return

  submission.isSubmitting = true
  submission.errorMessage = ''

  try {
    await linkAccount({ memberId: props.memberId })
    emit('completed')
  } catch {
    // 상세 오류는 composable이 기록하고 화면에는 재시도 가능한 메시지만 보여준다.
    submission.errorMessage = '계정 연결에 실패했습니다. 다시 시도해 주세요.'
    await nextTick()
    errorMessageRef.value?.focus()
  } finally {
    // 성공·실패와 관계없이 버튼을 다시 활성화해 다음 시도를 허용한다.
    submission.isSubmitting = false
  }
}
</script>

<template>
  <section aria-labelledby="social-link-title">
    <h2 id="social-link-title">{{ providerName }} 계정 연결</h2>
    <p>{{ accountLabel }}</p>
    <!-- 저장 실패 후에만 재시도 안내를 노출하고 키보드 포커스를 이 영역으로 옮긴다. -->
    <p
      v-if="submission.errorMessage"
      ref="errorMessageRef"
      role="alert"
      tabindex="-1"
    >
      {{ submission.errorMessage }}
    </p>
    <!-- 클릭은 중복 제출 가드와 성공·실패 상태 처리를 가진 submitConsent로 모은다. -->
    <button
      type="button"
      :disabled="submission.isSubmitting"
      @click="submitConsent"
    >
      연결하고 계속하기
    </button>
  </section>
</template>
```

### 가독성이 좋은 이유

- 컴포넌트와 composable의 책임 경계를 선언 가까이에 적었다.
- 모든 공개 props와 반환 화면의 계약을 컴포넌트 JSDoc에 모았다.
- emit은 단순 이벤트명이 아니라 상위 화면이 이동해도 되는 시점을 설명한다.
- `reactive` 속성은 UI 영향, `ref`는 DOM 접근 목적, `computed`는 대체 표시 정책을 적었다.
- `watch`, 조기 반환, 오류 메시지 변환을 포함한 필수 상태·경로의 목적과 영향을 설명했다.
- template의 조건 경로는 오류 영역이 생기는 시점과 포커스 영향을 설명했다.

## Pinia 상태·getter·action 계약

```ts
/** 여러 연동 화면이 공유하는 선택 계정과 저장 가능 여부를 관리한다. */
export const useSocialLinkStore = defineStore('socialLink', {
  state: () => ({
    /** 사용자가 선택한 연동 대상. 선택 전이나 완료 후에는 null이다. */
    selectedAccountId: null as string | null,
  }),
  getters: {
    /** 선택 계정이 있을 때만 저장 동작을 허용하는 파생 상태다. */
    canSubmit: (state) => state.selectedAccountId !== null,
  },
  actions: {
    /**
     * 연동 대상을 바꿔 이 store를 구독하는 확인 화면을 함께 갱신한다.
     * @param accountId 새로 선택한 제공자 계정 ID.
     */
    selectAccount(accountId: string) {
      this.selectedAccountId = accountId
    },
  },
})

/** 선택 계정과 저장 가능 여부를 읽고 action을 호출할 현재 Pinia store 인스턴스다. */
const socialLinkStore = useSocialLinkStore()

/** 선택 계정과 저장 가능 여부를 반응성을 유지한 채 화면에서 읽는다. */
const { selectedAccountId, canSubmit } = storeToRefs(socialLinkStore)

/** 사용자 선택 이벤트를 Pinia action으로 전달한다. */
const { selectAccount } = socialLinkStore
```

## 그대로 복제하지 않을 것

- `ref`는 반응형 값, `computed`는 계산값이라는 프레임워크 설명
- template 태그와 CSS 선택자를 한국어로 옮긴 주석
- props·emit 타입과 Vue API 이름만 반복하는 형식적 설명
- 실제 composable에서 확인하지 않은 로깅·재시도·캐시 정책
