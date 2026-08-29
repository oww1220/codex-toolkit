# 읽기 쉬운 Python/docstring 예시

프로젝트가 사용하는 docstring 형식을 우선한다. 아래 예시는 역할, 입력, 실패 정책을 분리하는 한 가지 방식이며 고정 템플릿이 아니다.

## 필수 적용 범위

- 모듈·클래스·공개 함수·메서드와 생성자 의존성의 역할·책임 경계
- 모든 인자, 반환값, yield와 실제로 발생·변환·재전파하는 예외 조건
- 목적이 숨은 속성·지역 변수와 모든 if/elif/else·조기 반환·match/case·반복 경로
- try/except/else/finally, context manager의 복구·해제·오류 처리 책임
- 파일·DB·네트워크 호출의 순서, 데이터 변경과 실패 후 보존할 상태

대상 코드에 존재하는 항목은 모두 점검 목록에 넣고 선언 또는 실행 경로 가까이에 설명한다.

## 서비스 메서드와 내부 흐름

```python
class SocialLinkService:
    """가입 흐름에 남은 소셜 계정 연결을 회원에게 등록한다."""

    def __init__(self, repository: SocialLinkRepository, logger: Logger) -> None:
        """연동 저장소와 부가 작업 실패를 기록할 로거를 주입받는다.

        Args:
            repository: 대기 중인 소셜 계정을 회원에게 연결할 저장소.
            logger: 가입을 되돌리지 않는 연동 실패를 기록할 로거.
        """
        self._repository = repository
        self._logger = logger

    def complete_pending_link(
        self,
        session: Session,
        member_id: str,
    ) -> None:
        """세션의 일회성 연동 정보를 현재 회원에게 저장한다.

        연동 정보가 없거나 저장에 실패해도 완료된 회원가입은 되돌리지 않는다.
        저장에 성공한 경우에만 세션 값을 제거한다.

        Args:
            session: 연동 대기 정보를 조회하고 제거할 사용자 세션.
            member_id: 소셜 계정을 연결할 가입 완료 회원 ID.

        Returns:
            없음. 연동 부재와 저장 실패는 가입 완료 흐름 밖으로 전파하지 않는다.
        """
        # 소셜 로그인에서 회원가입으로 넘어올 때만 존재하는 일회성 상태다.
        pending_link = session.get("pending_social_link")

        # 일반 회원가입처럼 연동할 계정이 없는 경우는 정상 흐름이다.
        if pending_link is None:
            return

        try:
            self._repository.save(
                member_id=member_id,
                provider=pending_link.provider,
                external_user_id=pending_link.external_user_id,
            )

            # 저장 전에 제거하면 실패 시 다시 연결할 정보를 잃는다.
            session.pop("pending_social_link", None)
        except SocialLinkError:
            # 부가 작업 실패가 회원가입 성공까지 실패로 바꾸지 않게 격리한다.
            self._logger.warning(
                "social link registration failed",
                extra={"member_id": member_id},
            )
```

### 가독성이 좋은 이유

- 클래스 docstring은 책임만, 메서드 docstring은 호출 계약과 실패 정책을 설명한다.
- 타입 힌트가 말해 주지 않는 세션 값의 출처와 수명을 변수 가까이에 적었다.
- 조기 반환, 저장 후 삭제, 예외 격리의 이유만 인라인으로 남겼다.
- 생성자 대입과 키워드 인자는 코드로 충분해 주석을 붙이지 않았다.

## 예외를 전파하는 함수

```python
def load_profile(path: Path) -> Profile:
    """저장된 프로필 JSON을 읽어 도메인 객체로 변환한다.

    Args:
        path: 애플리케이션 데이터 디렉터리 아래의 프로필 파일.

    Returns:
        필수 필드 검증을 마친 프로필.

    Raises:
        ValueError: JSON 구조가 프로필 계약을 만족하지 않는 경우.
        OSError: 파일을 읽을 수 없는 경우.
    """
    # 파싱 성공·실패와 관계없이 이 함수가 연 파일을 여기서 닫는다.
    with path.open(encoding="utf-8") as profile_file:
        payload = json.load(profile_file)

    return Profile.from_mapping(payload)
```

context manager에는 항상 해제할 자원과 책임 범위를 적고, 라이브러리 함수의 일반 동작은 반복하지 않는다. 호출자가 알아야 하는 예외 조건은 docstring에 남긴다.

## 그대로 복제하지 않을 것

- 타입 힌트와 함수명을 반복하는 docstring
- 이름·타입이나 반복 문법만 다시 읽어 주는 주석
- 라이브러리 함수의 일반적인 동작 설명
- 실제 구현에서 삼키는 예외를 `Raises`에 적거나 전파되는 예외를 누락하는 문서
