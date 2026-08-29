# 읽기 쉬운 Java/Javadoc 예시

아래 코드는 실제 프로젝트 식별자를 제거한 예시다. 클래스명, 세션 키, 저장소 이름, 화면 경로를 복사하지 말고 주석의 정보 구조만 참고한다.

## OAuth 제공자 클라이언트

```java
package example.auth;

import java.util.Map;

import javax.servlet.http.HttpSession;

/**
 * 외부 OAuth 제공자의 인가·토큰·프로필 API를 호출한다.
 *
 * <p>외부 API 통신만 담당한다. 회원 판정과 화면 이동은
 * {@link SocialLoginService}가 맡는다.</p>
 *
 * <h2>호출 순서</h2>
 * <pre>
 * 1. createAuthorizeUrl()  요청별 state 발급 후 인가 URL 생성
 * 2. 사용자가 제공자 화면에서 로그인·동의
 * 3. handleCallback()      state 검증 → 토큰 발급 → 프로필 조회
 * </pre>
 */
public interface OAuthProviderClient {

    /** CSRF 방지용 state를 보관하는 세션 키. */
    String SESSION_KEY_STATE = "OAUTH_STATE";

    /** 반환 키 — 제공자가 발급한 이용자 식별자. */
    String KEY_EXTERNAL_USER_ID = "externalUserId";

    /** 반환 키 — 회원 판정에만 사용하고 저장하지 않는 연계 식별값. */
    String KEY_LINKAGE_ID = "linkageId";

    /** 반환 키 — 회원 이메일이 아닌 제공자 계정의 부가 정보. */
    String KEY_PROVIDER_EMAIL = "providerEmail";

    /**
     * 인가 요청 URL을 만들고 요청별 state를 세션에 보관한다.
     *
     * <p>고정된 state는 사이트 간 요청 위조를 막지 못하므로 호출할 때마다 새로 발급한다.</p>
     *
     * @param session 인가 요청과 콜백 사이에서 state를 유지할 사용자 세션
     * @return 사용자를 이동시킬 제공자 인가 URL
     */
    String createAuthorizeUrl(HttpSession session);

    /**
     * 콜백의 state를 검증한 뒤 토큰을 발급받아 최소 프로필을 조회한다.
     *
     * <p>제공자 이용자 식별자, 연계 식별값, 제공자 이메일만 반환한다.
     * 이름·성별·연락처처럼 이 흐름에서 사용하지 않는 정보는 넘기지 않는다.</p>
     *
     * <p>연계 식별값은 사용자가 제공을 거부하면 없을 수 있다. 호출자는 이 경우
     * 회원 판정을 중단하고 별도 본인인증 흐름으로 보내야 한다.</p>
     *
     * @param session 인가 요청 때 발급한 state가 저장된 사용자 세션
     * @param code 제공자가 콜백으로 전달한 일회성 인증 코드
     * @param state 제공자가 콜백으로 돌려준 CSRF 검증값
     * @return 회원 판정과 연동 기록에 필요한 최소 프로필
     * @throws OAuthException state 검증, 토큰 발급 또는 프로필 조회에 실패한 경우
     */
    Map<String, String> handleCallback(HttpSession session, String code, String state)
            throws OAuthException;

    /**
     * 새로 발급한 토큰으로 계정을 대조한 뒤 제공자 연결을 폐기한다.
     *
     * <p>토큰은 구현 밖으로 반환하거나 보관하지 않는다. 폐기 API가 만료되거나 존재하지 않는
     * 토큰에도 성공을 반환할 수 있어, 저장한 토큰으로는 실제 해제를 확인할 수 없기 때문이다.</p>
     *
     * @param expectedExternalUserId 서비스에 연동된 제공자 이용자 식별자
     * @return 계정 대조와 토큰 폐기 결과
     * @throws OAuthException state 검증, 토큰 발급 또는 프로필 조회를 완료하지 못한 경우
     */
    UnlinkResult handleUnlinkCallback(
            HttpSession session,
            String code,
            String state,
            String expectedExternalUserId
    ) throws OAuthException;

    enum UnlinkResult {
        /** 계정이 일치해 연결 폐기를 마쳤다. */
        REVOKED,

        /**
         * 다른 계정으로 인가되어 원래 연결은 유지됐다.
         *
         * <p>인가 과정에서 새로 생긴 연결을 남기지 않도록 방금 발급한 토큰은 폐기한다.</p>
         */
        ACCOUNT_MISMATCH,

        /** 폐기를 완료하지 못해 제공자 연결이 남아 있을 수 있다. */
        FAILED
    }
}
```

### 가독성이 좋은 이유

- 첫 두 문장만으로 외부 API 호출과 회원 판정의 책임 경계가 드러난다.
- 시간 순서가 있는 OAuth 흐름은 문장 대신 단계로 보여준다.
- 반환 데이터의 최소 범위와 보관하지 않는 이유를 함께 적는다.
- `@param`, `@return`, `@throws`가 타입을 반복하지 않고 호출 계약을 설명한다.

## 소셜 로그인 흐름 조율 서비스

```java
package example.auth;

import javax.servlet.http.HttpSession;

/**
 * 제공자별 OAuth 클라이언트를 호출하고 회원 판정과 화면 이동을 조율한다.
 *
 * <p>제공자마다 서비스를 나누지 않는다. 인가 → 콜백 → 판정 → 로그인 흐름은 같고
 * 외부 API 통신만 달라, 서비스를 나누면 같은 판정 코드가 중복되기 때문이다.</p>
 *
 * <h2>회원 판정</h2>
 * <pre>
 * 1. 연동 정보가 있으면 해당 회원으로 로그인
 * 2. 연동 정보는 없지만 같은 연계 식별값의 회원이 있으면 연동 동의 후 로그인
 * 3. 둘 다 없으면 본인인증과 회원가입으로 이동
 * </pre>
 *
 * <p>본인인증 서비스는 회원 식별값을 확보하고, 이 서비스는 소셜 계정을 연결한다.
 * 이름이 비슷한 콘텐츠 수집용 소셜 패키지와는 관계가 없다.</p>
 */
public interface SocialLoginService {

    /**
     * 가입 후 소셜 계정을 연결하기 위해 세션에 남기는 대기 정보 키.
     *
     * <p>제공자 구분과 외부 이용자 식별자만 보관한다. 회원 판정용 연계 식별값은
     * 조회 직후 폐기하므로 세션에 넣지 않는다.</p>
     */
    String SESSION_KEY_PENDING_LINK = "PENDING_SOCIAL_LINK";

    /**
     * 세션의 연동 대기 정보를 가입된 회원에게 등록하고 성공한 경우 제거한다.
     *
     * <p>소셜 로그인으로 시작했지만 비회원으로 판정되어 본인인증과 가입을 거친 흐름의
     * 마지막 단계다. 대기 정보가 없으면 아무 일도 하지 않는다.</p>
     *
     * <p>연동 실패가 완료된 가입을 되돌리지 않도록 예외를 외부로 전파하지 않고 기록한다.</p>
     *
     * @param session 연동 대기 정보가 저장될 수 있는 사용자 세션
     * @param memberId 가입을 마치고 로그인이 성립한 회원 식별자
     * @param registrarId 연동 기록의 등록자로 남길 사용자 식별자
     */
    void linkPending(HttpSession session, String memberId, String registrarId);

    /**
     * 기존 회원에게 소셜 계정 연동 동의 화면을 보여준다.
     *
     * <p>연동 정보는 없지만 연계 식별값으로 기존 회원을 찾은 경우 진입한다.
     * 동의해 연동 정보가 저장되기 전까지는 소셜 로그인 때마다 이 화면을 거친다.</p>
     *
     * @param context 요청 파라미터와 화면 이동 정보를 가진 현재 요청 컨텍스트
     * @throws ServiceException 동의 화면을 준비하거나 이동하지 못한 경우
     */
    void showIntegrationConsent(RequestContext context) throws ServiceException;

    /**
     * 사용자의 동의를 반영해 소셜 식별값을 저장하고 원래 요청한 화면으로 이동한다.
     *
     * @param context 연동 대상 회원과 원래 이동 경로를 가진 현재 요청 컨텍스트
     * @throws ServiceException 연동 정보를 저장하거나 화면을 이동하지 못한 경우
     */
    void integrate(RequestContext context) throws ServiceException;

    /**
     * 제공자 인가를 다시 거쳐 새로 받은 토큰으로 연결을 폐기한다.
     *
     * <p>토큰을 보관하지 않으므로 해제할 때도 인가 왕복이 필요하다. 만료 여부를 확인할 수 없는
     * 토큰을 저장하면 폐기 API의 성공 응답만으로 실제 해제를 판단하게 될 수 있다.</p>
     *
     * @param context 로그인 회원과 해제할 제공자 정보가 담긴 현재 요청 컨텍스트
     * @throws ServiceException 인가 화면으로 이동하거나 해제 결과를 처리하지 못한 경우
     */
    void unlink(RequestContext context) throws ServiceException;

    /** 제공자 인가 화면으로 이동한다. */
    void startProviderLogin(RequestContext context) throws ServiceException;

    /**
     * 제공자 콜백을 받아 회원을 판정하고 다음 화면으로 이동한다.
     *
     * <p>콜백 URL은 제공자 설정에 등록된 값과 정확히 일치해야 한다.</p>
     */
    void handleProviderCallback(RequestContext context) throws ServiceException;
}
```

### 가독성이 좋은 이유

- 인터페이스 설명에서 조율 책임과 다른 서비스·패키지와의 경계를 먼저 고정한다.
- 회원 판정 규칙을 세 단계로 분리해 중첩된 조건문을 읽지 않아도 흐름을 알 수 있다.
- 세션에 보관하는 값과 보관하지 않는 값을 이유와 함께 명시한다.
- 짧고 자명한 메서드는 한 줄 설명으로 끝내고, 중요한 계약이 있는 메서드만 문단을 늘린다.

## 그대로 복제하지 않을 것

- 프로젝트에 존재하지 않는 클래스, 화면, 테이블, 문서 식별자
- 실제 구현에서 확인하지 않은 호출 순서와 실패 정책
- 모든 상수와 메서드를 같은 길이로 설명하는 형식적 균일성
- 코드보다 먼저 낡을 가능성이 큰 구현 세부사항
