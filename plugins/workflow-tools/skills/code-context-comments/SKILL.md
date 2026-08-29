---
name: code-context-comments
description: Use when writing or changing code whose responsibilities, contracts, data flow, side effects, failure handling, or design rationale need comments to remain understandable to future readers. Trigger on requests for comments, Javadoc, JSDoc, docstrings, or easier code comprehension.
---

# Code Context Comments

## 핵심 원칙

주석은 코드를 다시 읽지 않고도 역할과 계약을 빠르게 파악하게 한다. 정확한 정보를 읽기 쉬운 구조로 남기며, 자명한 코드를 문장으로 반복하지 않는다.

## 작성 순서

1. 대상 선언의 구현, 호출자, 데이터 흐름, 기존 주석을 확인한다.
2. 코드만으로 알기 어려운 계약과 이유를 골라 해당 구문 가까이에 설명한다.
3. 낡은 주석을 바로잡고, 주석만 훑어도 핵심이 보이면서 코드 읽기를 방해하지 않는지 확인한다.

## 구문 컨텍스트별 정보 구조

| 구문 컨텍스트 | 담을 내용 |
|---|---|
| 모듈·클래스·인터페이스 | 핵심 역할, 책임 경계, 주요 협력 대상, 전체 흐름 |
| 필드·상수 | 도메인 의미, 저장 범위, 단위, 제약, 보관 이유 |
| 메서드·함수 | 역할, 호출 조건, 입력·반환, 상태 변화, 부작용, 실패 처리 |
| `@param` | 값의 출처, 의미, 허용 조건 |
| `@return` | 반환값의 의미와 중요한 상태 |
| `@throws` | 예외가 발생하는 실제 조건 |
| 지역 변수·반응형 상태·참조 | 값의 출처, 사용 목적, UI 영향, 갱신 주체, 수명, 참조 대상 |
| 조건문·조기 반환 | 조건의 도메인 의미와 이 경로를 종료·건너뛰는 이유 |
| 반복문 | 반복 대상, 종료 조건, 순서가 중요한 이유 |
| `catch`/`finally` | catch의 기록·변환·삼킴·재전파와 상위 영향, finally가 항상 복구·해제할 상태·자원 |
| watch·effect·구독·외부 호출 | 실행 조건, 변경 대상, 정리 시점, 호출 순서 |
| 목록·코드 블록 | 여러 단계의 호출 순서, 상태 전이, 판정 흐름 |

- 문단마다 한 주제만 짧게 쓰고 프로젝트 용어와 기존 형식을 우선한다.
- 약어는 처음 한 번만 풀고, 문서·화면·테이블 식별자는 필요하고 안정적일 때만 쓴다.
- 외부 응답, 세션 값, 중간 판정값처럼 중요한 변수는 선언 가까이에 설명한다. 이름이 충분하면 주석보다 정확한 이름을 택한다.
- 상세함과 가독성이 충돌하면 구현 세부사항을 덜고 계약과 이유를 남긴다.

## 정확성과 안전

- 계약이나 흐름이 바뀌면 같은 변경에서 주석도 갱신한다. 확인하지 못한 의도는 추측하지 않는다.
- 비밀키, 토큰, 실제 개인정보, 내부 접속정보를 기록하지 않고 생성·외부·마이그레이션 산출물은 수정하지 않는다.

## 주석을 생략할 곳

- 자명한 getter/setter, 단순 위임, DTO, 한 줄 내부 함수, 익명 콜백
- 이름과 타입만으로 역할이 분명한 변수
- 코드 한 줄씩을 한국어로 옮긴 설명

## 흔한 실패

- 모든 줄·변수에 주석을 붙임 → 비자명한 계약, 역할, 이유만 남긴다.
- 말머리와 긴 배경이 역할을 가림 → 첫 문장에 역할을 쓰고 주제별로 나눈다.
- 호출자를 보지 않고 추측함 → 실제 호출 경로에서 확인되는 내용만 쓴다.

## 언어별 예시

작업 언어 파일 하나만 읽는다. 혼합 작업은 필요한 파일만 함께 읽는다.

- Java: [Javadoc 예시](references/java-javadoc-examples.md)
- JavaScript·TypeScript·TSX: [JSDoc 예시](references/typescript-jsdoc-examples.md)
- Vue: [SFC 예시](references/vue-sfc-comment-examples.md)
- Python: [docstring 예시](references/python-docstring-examples.md)
