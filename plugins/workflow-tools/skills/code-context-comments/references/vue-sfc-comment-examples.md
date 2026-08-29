# 읽기 쉬운 Vue SFC 주석 예시

Vue 예시는 `<script setup>`의 컴포넌트 계약과 반응형 흐름에 집중한다. template 태그와 style 규칙은 그대로 읽을 수 있으므로 해설하지 않는다.

## 연동 동의 컴포넌트

```vue
<script setup lang="ts">
/**
 * 기존 회원에게 연동 계정을 확인시키고 동의 결과를 상위 흐름에 전달한다.
 *
 * OAuth 인가와 저장 요청은 composable에 맡기며, 이 컴포넌트는 화면 상태만 관리한다.
 */
import { computed, nextTick, reactive, ref, watch } from 'vue'

import { useSocialLink } from '@/composables/useSocialLink'

type Props = {
  /** 연동 정보를 저장할 기존 회원 ID. 현재 로그인 회원 판정이 끝난 뒤 전달된다. */
  memberId: string
  /** 제공자 코드가 아니라 화면 제목에 표시할 사용자 친화적 이름. */
  providerName: string
  /** 제공자가 돌려준 마스킹 계정 정보. 제공 거부·미제공이면 null이다. */
  maskedAccount: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** 연동 저장이 끝나 상위 화면이 다음 단계로 이동해도 될 때 발생한다. */
  completed: []
}>()

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
    <p
      v-if="submission.errorMessage"
      ref="errorMessageRef"
      role="alert"
      tabindex="-1"
    >
      {{ submission.errorMessage }}
    </p>
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
- 모든 공개 props는 값의 사용 목적, 전달 시점, `null` 의미를 선언 위치에 설명했다.
- emit은 단순 이벤트명이 아니라 상위 화면이 이동해도 되는 시점을 설명한다.
- `reactive` 속성은 UI 영향, `ref`는 DOM 접근 목적, `computed`는 대체 표시 정책을 적었다.
- `watch`, 조기 반환, 오류 메시지 변환처럼 코드만으로 이유가 숨은 지점만 설명한다.
- template 구조는 코드로 충분해 주석을 반복하지 않았다.

## 그대로 복제하지 않을 것

- `ref`는 반응형 값, `computed`는 계산값이라는 프레임워크 설명
- template 태그와 CSS 선택자를 한국어로 옮긴 주석
- props·emit 타입과 Vue API 이름만 반복하는 형식적 설명
- 실제 composable에서 확인하지 않은 로깅·재시도·캐시 정책
