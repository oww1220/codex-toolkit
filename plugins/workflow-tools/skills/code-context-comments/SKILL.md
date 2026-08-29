---
name: code-context-comments
description: Use when writing or changing code whose responsibilities, contracts, data flow, side effects, failure handling, or design rationale need comments to remain understandable to future readers. Trigger on requests for comments, Javadoc, JSDoc, docstrings, or easier code comprehension.
---

# Code Context Comments

## 핵심 원칙

주석은 역할과 계약을 빠르게 파악하게 하며 코드를 문장으로 반복하지 않는다.

## 필수 점검 절차

1. 작업 언어의 레퍼런스를 처음부터 끝까지 읽는다.
2. 구현·호출자·데이터 흐름을 확인하고 `파일 × 필수 적용 범위` 목록을 만든다.
3. 레퍼런스에 정의된 구문이 있으면 모든 발생 지점을 확인해 목적·영향·이유를 가까이에 설명한다.
4. 변경 파일과 목록을 다시 대조해 빠진 필수 항목이 없을 때만 완료한다.

대상 코드의 필수 선언·상태·분기·반복·예외·effect·store·props·템플릿·스타일은 생략하지 않는다. 모든 조건 경로의 의미를 쓰며 인접 경로는 모두 설명될 때만 루트 주석으로 묶는다.

## 사후 독립 검증

주석 작성 후 도구가 있으면 reviewer 요청에 사용자 지정 디렉터리·모듈·파일 경로를 모두 명시한다. `reviewer`가 대상 전체와 레퍼런스를 읽기 전용으로 대조하고, 누락은 `파일:위치 / 누락 항목 / 필요한 설명`으로, 없으면 `누락 0건`으로 보고하며 수정하지 않는다.

메인 에이전트가 보완하고 변경했다면 같은 reviewer가 재검토한다. 누락 0건일 때만 완료한다. 도구가 없으면 메인이 별도 재검토한다.

## 구문 컨텍스트별 정보 구조

| 구문 컨텍스트 | 담을 내용 |
|---|---|
| 모듈·클래스·인터페이스·타입 | 역할, 경계, 불변조건, 협력 흐름 |
| 엔티티·필드·상수 | 도메인 의미, 관계, nullable, 보관·삭제 정책 |
| 메서드·함수 | 역할, 호출 조건, 입력·반환, 상태·부작용·실패 처리 |
| `@param`·`@return`·`@throws` | 값의 출처·의미·허용 조건, 반환 상태, 실제 예외 조건 |
| 지역 변수 | 숨은 출처, 목적, 단위, 수명 |
| 반응형·스토어 상태·참조 | 목적, UI 영향, 갱신 조건·주체 |
| computed·memo·파생값 | 입력 상태, fallback, 재계산 의미 |
| 조건·반복·예외 경로 | 도메인 의미, 종료·생략·순서, catch 변환·전파와 finally 복구 책임 |
| watch·effect·구독·외부 호출 | 실행 조건, 변경 대상, cleanup, 순서 |

- 문단마다 한 주제만 짧게 쓰고 프로젝트 용어와 기존 형식을 우선한다.
- 약어는 처음만 풀고 외부 식별자는 필요·안정적일 때만 쓴다.
- 상세함과 가독성이 충돌하면 구현 세부사항을 덜고 계약과 이유를 남긴다.

## 정확성과 안전

- 계약이나 흐름이 바뀌면 같은 변경에서 주석도 갱신한다. 확인하지 못한 의도는 추측하지 않는다.
- 비밀키, 토큰, 실제 개인정보, 내부 접속정보를 기록하지 않고 생성·외부·마이그레이션 산출물은 수정하지 않는다.

## 생략 범위

- 생성 코드·외부 라이브러리·마이그레이션 산출물
- 해당 언어 레퍼런스의 필수 구문이 대상 코드에 없는 경우

필수 항목에는 자명하다는 이유로 생략하지 않는다. 코드 번역 대신 그 선언과 경로가 존재하는 목적·영향·이유를 쓴다.

## 언어별 필수 점검 기준

작업 언어의 파일만 읽되 그 안의 `필수 적용 범위`는 모두 적용한다.
TSX·Vue SFC처럼 여러 언어가 섞인 파일은 관련 레퍼런스를 모두 읽는다.

- Java: [Javadoc 기준](references/java-javadoc-examples.md)
- JavaScript·TypeScript·NestJS: [JSDoc 기준](references/typescript-jsdoc-examples.md)
- React·TSX: [React 기준](references/react-comment-examples.md)
- Vue: [SFC 기준](references/vue-sfc-comment-examples.md)
- EJS·JSP·Thymeleaf: [템플릿 기준](references/template-comment-examples.md)
- SCSS: [스타일 기준](references/style-comment-examples.md)
- Python: [docstring 기준](references/python-docstring-examples.md)
