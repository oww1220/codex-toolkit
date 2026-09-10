---
name: superpowers-workflow
description: >
  사용자가 `$superpowers-workflow`를 명시해 Superpowers의 설계, 계획, 구현, 검토, 검증, 브랜치 마무리 단계를 끊김 없이 진행하려는 경우에 사용한다.
  트리거 — “$superpowers-workflow로 진행해줘”.
  비-트리거: 단일 Superpowers 스킬만 요청하거나 일반 개발 요청에서 자동 적용하지 않는다.
---

# Superpowers Workflow

명시 호출된 개발 흐름이 끝날 때까지 현재 단계의 완료 증거를 확인하고 다음 필수 Superpowers 스킬을 호출한다. 각 스킬의 세부 절차는 해당 스킬에 맡기며 여기서 복제하지 않는다.

## Rules

- 단계에 진입하기 전에 표의 스킬을 호출한다.
- 완료 증거가 없으면 다음 단계로 넘어가지 않고 현재 단계에서 필요한 사용자 판단을 요청한다.
- 계획 완료 후 Inline 또는 Subagent 실행 방식을 사용자에게 확인한다. 래퍼 호출만으로 서브에이전트 사용이 승인됐다고 간주하지 않는다.
- 현재 단계, 확인한 완료 증거, 다음 호출 스킬을 전환 시점마다 짧게 알린다.

## Workflow

| 현재 단계 | REQUIRED SUB-SKILL | 완료 증거 | 다음 단계 |
|---|---|---|---|
| 요청 분류와 설계 | `superpowers:brainstorming` | spike 결과 또는 사용자가 승인한 설계 | spike면 종료, 다단계 설계면 계획 |
| 계획 | `superpowers:writing-plans` | 자체 검토를 마친 구현 계획 | 실행 방식 선택 |
| Inline 실행 | `superpowers:executing-plans` | 계획의 모든 작업과 검증 완료 | 최종 검증 |
| Subagent 실행 | `superpowers:subagent-driven-development` | task별 구현과 리뷰 완료 | 최종 검증 |
| 구현 작업 | `superpowers:test-driven-development` | 실패를 확인한 검증이 최소 구현 후 통과 | 선택한 실행 흐름으로 복귀 |
| Subagent task 리뷰 | `superpowers:requesting-code-review` | Critical·Important 지적 반영 완료 | 다음 task 또는 최종 검증 |
| 최종 검증 | `superpowers:verification-before-completion` | 현재 상태에서 실행한 전체 검증의 성공 증거 | 브랜치 마무리 |
| 브랜치 마무리 | `superpowers:finishing-a-development-branch` | 사용자가 선택한 통합 또는 보존 처리 완료 | 종료 |

## Branches

- 계획이 한 단계뿐인 bounded 작업은 `superpowers:brainstorming`의 승인 후 계획 문서를 만들지 않고 구현 작업으로 이동한다.
- 실행 중 실패나 예상 밖 동작은 `superpowers:systematic-debugging`으로 원인을 확인한 뒤 해당 구현 작업으로 복귀한다.
- 리뷰 피드백은 `superpowers:receiving-code-review`로 검증하고, 수정이 필요하면 구현 작업과 최종 검증을 다시 거친다.
- 사용자 요청, 승인, 계획 또는 검증이 바뀌면 그 증거를 요구하는 가장 이른 단계로 돌아간다.
