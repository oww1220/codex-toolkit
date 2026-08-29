# 읽기 쉬운 템플릿 주석 예시

템플릿 주석은 렌더링 코드에 숨은 입력 계약, scope, 분기 의미, include·fragment 경계와 출력 안전성을 설명한다. 태그나 표현식을 한국어로 다시 읽어주지 않는다.

## 필수 적용 범위

- 페이지 입력·model·request/session scope와 include·partial·fragment의 전달·반환 책임
- 모든 조건 분기 루트와 if/else·choose/when/otherwise·switch/case의 각 화면 경로
- 모든 반복 입력의 정렬·필터 계약, 반복 내부 조건, 빈 목록·조회 실패의 구분
- 폼 model binding·검증 오류·재진입 상태와 사용자 입력의 저장 전 의미
- escaping을 끄는 EJS `<%-`, JSP `escapeXml="false"`, Thymeleaf `th:utext`의 신뢰 경계

대상 템플릿에 존재하는 항목은 모두 점검 목록에 넣고 구문 가까이에 설명한다.

## EJS

### 페이지 입력과 상태 분기

```ejs
<%#
  계정 연결 화면 입력 계약:
  - account: 표시용 마스킹이 끝난 계정. 정보 제공 거부 시 null
  - connectionState: CONNECTED, EXPIRED, REVOKED 중 하나
  - canReconnect: 서버가 로그인 상태와 채널 정책을 확인한 결과

  account 부재는 정상적인 정보 미제공 상태다. 연결 만료만 재인가 안내로 분기한다.
%>
<%# 연결 상태에 따라 사용자의 다음 행동을 하나만 노출하는 분기 루트다. %>
<% if (connectionState === 'EXPIRED' && canReconnect) { %>
  <%# 만료된 연결은 같은 계정의 재인가가 필요하므로 다시 연결 동작을 노출한다. %>
  <%- include('partials/reconnect-notice', { providerName: account?.providerName }) %>
<% } else if (account) { %>
  <%# 정상 연결은 해제 전 확인에 필요한 마스킹 계정만 표시한다. %>
  <%- include('partials/account-summary', { account }) %>
<% } else { %>
  <%# 정보 미제공·해제 상태는 연결된 계정으로 오인하지 않도록 공통 안내로 모은다. %>
  <p>제공된 계정 정보가 없습니다.</p>
<% } %>
```

주석은 값의 생성 과정을 늘어놓기보다 null의 의미, 허용 상태와 분기 목적을 남긴다.

### include 호출과 partial 계약

```ejs
<%#
  account-summary partial에 화면 표시가 허용된 값만 전달한다.
  원본 식별자와 토큰은 partial의 입력 계약에 포함하지 않는다.
%>
<%- include('partials/account-summary', {
  label: account.maskedLabel,
  connectedAt: account.connectedAt,
}) %>
```

```ejs
<%#
  account-summary partial 입력:
  - label: 제공자 이름을 포함한 마스킹 계정 표기
  - connectedAt: 사용자 시간대로 변환하기 전의 연결 시각
  호출자는 두 값을 모두 전달해야 하며 partial은 원본 계정을 조회하지 않는다.
%>
<strong><%= label %></strong>
<time datetime="<%= connectedAt.toISOString() %>"><%= formatDate(connectedAt) %></time>
```

호출부는 왜 값을 좁혀 넘기는지, partial은 필수 입력과 책임 경계를 설명한다.

### 반복·빈 상태와 원문 출력

```ejs
<%#
  connections는 서버가 표시 가능한 항목만 최신순으로 정렬한 목록이다.
  빈 배열은 조회 실패가 아니라 연결 이력이 없는 정상 상태다.
%>
<% if (connections.length === 0) { %>
  <%# 빈 상태에서는 목록 wrapper를 만들지 않아 보조기기가 빈 목록으로 읽지 않게 한다. %>
  <p>연결 이력이 없습니다.</p>
<% } else { %>
  <% connections.forEach((connection, index) => { %>
    <%- include('partials/connection-row', { connection }) %>

    <% if (index < connections.length - 1) { %>
      <%# 마지막 행 뒤에는 구분선을 만들지 않아 목록 하단 여백을 유지한다. %>
      <hr />
    <% } %>
  <% }) %>
<% } %>

<%# 허용 태그만 남기도록 서버에서 sanitize한 공지 HTML이다. 다른 값에는 원문 출력을 사용하지 않는다. %>
<%- sanitizedNoticeHtml %>
```

분기 루트에는 전체 판정 목적을, 각 경로에는 사용자 상태와 다음 행동을 적는다. 반복문에는 입력 목록의 정렬·필터 계약과 반복 내부 분기의 이유를 남긴다.

`<%-`처럼 escaping을 끄는 구문에는 신뢰 경계와 사전 정제 근거를 바로 앞에 남긴다.

## JSP

### scope와 페이지 입력 계약

```jsp
<%--
  계정 연결 화면 입력 계약:
  - requestScope.account: 현재 요청에서만 사용하는 마스킹 계정 정보
  - requestScope.connectionState: 컨트롤러가 판정한 연결 상태
  - sessionScope.loginUser: 헤더의 로그인 표시 전용. 계정 연결 판정에는 사용하지 않는다.

  이름이 같은 값이 다른 scope에 생겨도 request 값을 사용하도록 scope를 명시한다.
--%>
<c:set var="account" value="${requestScope.account}" />
```

scope가 계약의 일부이거나 이름 충돌 가능성이 있을 때만 명시적으로 설명한다.

### include와 조건부 출력

```jsp
<%--
  account-summary.jsp 입력:
  - requestScope.account: 표시용 마스킹이 끝난 계정 정보
  - showReconnect: 현재 요청에서 재인가 동작을 노출할지 결정하는 문자열 boolean

  account 부재는 정보 제공 거부에 따른 정상 상태이므로 오류 영역을 만들지 않는다.
--%>
<c:if test="${not empty requestScope.account}">
  <jsp:include page="/WEB-INF/views/fragments/account-summary.jsp">
    <jsp:param name="showReconnect" value="${requestScope.showReconnect}" />
  </jsp:include>
</c:if>
```

include 주석에는 전달값의 타입보다 출처, 의미, 생략 가능성과 호출 후 책임을 적는다.

### 분기 루트와 반복 본문

```jsp
<%-- 연결 상태에 따라 사용자의 다음 행동을 하나만 노출하는 분기 루트다. --%>
<c:choose>
  <%-- 만료된 연결은 같은 계정의 재인가가 필요하므로 다시 연결 동작을 노출한다. --%>
  <c:when test="${requestScope.connectionState eq 'EXPIRED'}">
    <jsp:include page="/WEB-INF/views/fragments/reconnect-notice.jsp" />
  </c:when>

  <%-- 정상 연결은 해제 전 확인에 필요한 마스킹 계정만 표시한다. --%>
  <c:when test="${requestScope.connectionState eq 'CONNECTED'}">
    <jsp:include page="/WEB-INF/views/fragments/account-summary.jsp" />
  </c:when>

  <%-- 계정 미제공·해제 상태는 연결된 계정으로 오인하지 않도록 공통 미연결 안내로 모은다. --%>
  <c:otherwise>
    <p>연결된 계정이 없습니다.</p>
  </c:otherwise>
</c:choose>

<%--
  connections는 컨트롤러가 표시 가능한 항목만 최신순으로 정렬한 목록이다.
  템플릿은 순서를 바꾸거나 상태를 다시 필터링하지 않고 행과 구분선만 렌더링한다.
--%>
<c:forEach items="${requestScope.connections}" var="connection" varStatus="loop">
  <jsp:include page="/WEB-INF/views/fragments/connection-row.jsp">
    <jsp:param name="maskedLabel" value="${connection.maskedLabel}" />
  </jsp:include>

  <%-- 마지막 행 뒤에는 구분선을 만들지 않아 목록 하단 여백을 유지한다. --%>
  <c:if test="${not loop.last}">
    <hr />
  </c:if>
</c:forEach>
```

분기 루트에는 전체 판정 목적을, 각 경로에는 사용자 상태와 다음 행동을 적는다. 반복문에는 입력 목록의 정렬·필터 계약과 반복 내부 분기의 이유를 남긴다.

### 폼 바인딩과 오류 표시

```jsp
<%--
  profileForm은 GET에서 초기화하고 POST 실패 시 BindingResult와 함께 되돌아온다.
  입력값은 재표시할 수 있지만 저장된 회원정보로 간주하지 않는다.
  필드 오류는 서버 검증 결과이며 이 화면에서 검증 규칙을 다시 구현하지 않는다.
--%>
<form:form modelAttribute="profileForm" method="post">
  <form:input path="email" />
  <form:errors path="email" cssClass="field-error" />
</form:form>
```

폼 주석은 model attribute의 생성·재진입 조건, 검증 결과의 출처와 저장 전 상태를 설명한다.

### escaping 해제

```jsp
<%-- 허용 태그만 남기도록 서비스에서 sanitize한 공지 HTML이며, 이 값 외에는 escapeXml을 끄지 않는다. --%>
<c:out value="${requestScope.sanitizedNoticeHtml}" escapeXml="false" />
```

권한 검사를 화면 분기 주석으로 정당화하지 않는다. 보안 권한은 서버에서 이미 강제하고, 템플릿 조건은 노출 제어만 담당해야 한다.

## Thymeleaf

### 모델과 화면 상태 계약

```html
<!--/*
  계정 연결 화면 모델:
  - account: 표시용 마스킹 계정. 정보 제공 거부 시 null
  - connectionState: 서버가 판정한 연결 상태
  - canReconnect: 로그인·채널 정책을 확인한 재인가 노출 여부

  account가 null인 상태와 연결 만료 상태를 구분해 서로 다른 안내를 렌더링한다.
*/-->
<section th:if="${connectionState.name() == 'EXPIRED' and canReconnect}">
  <p>계정 연결이 만료되었습니다.</p>
</section>
```

### fragment 선언과 호출 계약

```html
<!--/*
  accountSummary fragment 입력:
  - account: 화면 표시용 마스킹 계정 정보
  - showReconnect: 재인가 동작을 노출할 수 있을 때만 true
  account가 null이면 fragment 전체를 렌더링하지 않는다.
*/-->
<section
  th:fragment="accountSummary(account, showReconnect)"
  th:if="${account != null}"
>
  <span th:text="${account.maskedLabel}"></span>
  <a th:if="${showReconnect}" th:href="@{/account/reconnect}">다시 연결</a>
</section>
```

```html
<!--/* 원본 계정 대신 fragment가 표시할 값만 담은 accountView를 전달한다. */-->
<section th:replace="~{fragments/account-summary :: accountSummary(${accountView}, ${canReconnect})}"></section>
```

fragment 양쪽에 같은 설명을 반복하지 않는다. 선언부는 입력 계약, 호출부는 값 가공이나 선택 이유를 설명한다.

### 분기 루트와 반복 본문

```html
<!--/* 연결 상태에 따라 사용자의 다음 행동을 하나만 노출하는 분기 루트다. */-->
<div th:switch="${connectionState}">
  <!--/* 만료된 연결은 같은 계정으로 다시 인가해야 하므로 재연결 동작을 노출한다. */-->
  <section th:case="'EXPIRED'">
    <a th:href="@{/account/reconnect}">다시 연결</a>
  </section>

  <!--/* 정상 연결은 해제 전 확인에 필요한 마스킹 계정만 표시한다. */-->
  <section th:case="'CONNECTED'" th:replace="~{fragments/account-summary :: accountSummary(${account}, false)}"></section>

  <!--/* 계정 미제공·해제 상태는 연결된 계정으로 오인하지 않도록 공통 미연결 안내로 모은다. */-->
  <p th:case="*">연결된 계정이 없습니다.</p>
</div>

<!--/*
  connections는 서비스가 표시 가능한 항목만 최신순으로 정렬한 목록이다.
  템플릿은 정책을 다시 판정하지 않고 전달된 순서대로 행과 구분선만 렌더링한다.
*/-->
<ul>
  <li th:each="connection, loop : ${connections}">
    <span th:text="${connection.maskedLabel}"></span>

    <!--/* 첫 항목은 가장 최근 연결이며 현재 연결 표시는 이 위치에만 붙인다. */-->
    <strong th:if="${loop.first}">현재</strong>
  </li>
</ul>
```

분기 루트와 각 `th:case`의 의미를 나눠 쓰고, `th:each`에는 목록의 사전 가공 상태와 반복 상태값을 사용하는 이유를 설명한다.

### 빈 상태와 폼 바인딩

```html
<!--/* 조회 성공 후 결과가 비어 있는 상태다. 조회 실패 안내는 컨트롤러가 별도 상태로 전달한다. */-->
<p th:if="${#lists.isEmpty(connections)}">연결 이력이 없습니다.</p>
<ul th:unless="${#lists.isEmpty(connections)}">
  <li th:each="connection : ${connections}" th:text="${connection.maskedLabel}"></li>
</ul>

<!--/*
  profileForm은 서버 검증 실패 시 사용자가 입력한 값과 오류를 보존해 돌아온다.
  th:errors는 BindingResult를 표시하며 템플릿에서 검증 규칙을 재판정하지 않는다.
*/-->
<form th:object="${profileForm}" th:action="@{/profile}" method="post">
  <input th:field="*{email}" />
  <p th:errors="*{email}"></p>
</form>
```

### 원문 출력

```html
<!--/* 서버에서 허용 태그만 남긴 공지 HTML만 원문 출력한다. */-->
<div th:utext="${sanitizedNoticeHtml}"></div>
```

## 그대로 복제하지 않을 것

- 프로젝트마다 다른 model·scope·partial·JSP·fragment 이름과 전달값
- 확인하지 않은 sanitize, 개인정보 가공, 인증·인가 정책
- 실제 컨트롤러가 보장하지 않는 enum 상태와 빈 값의 의미
- 프레임워크 설정에 따라 달라지는 CSRF, 폼 바인딩과 오류 처리 방식
