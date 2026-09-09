---
name: playwright-e2e-builder
description: >
  Node.js 웹 프로젝트에서 Playwright로 재실행 가능한 사용자 흐름 E2E 테스트를 새로 만들고 검증할 때 사용한다. 트리거 — "E2E 테스트
  만들어줘", "회원가입 흐름을 Playwright 테스트로 만들어줘", "이 사용자 흐름을 재실행 가능한 브라우저 테스트로 남겨줘". 비-트리거:
  일회성 브라우저 조작; API 전용 테스트; 네이티브 모바일 테스트; 기존 실패 테스트의 일반 디버깅.
---

# Playwright E2E Builder

자연어 사용자 흐름을 프로젝트에 남는 `@playwright/test` spec으로 작성하고 실제 브라우저 실행으로 검증한다.

## Constraints

- ✅ 작업 전에 `git status --short`, 저장소 지침, `package.json`, lockfile, 기존 Playwright config·spec·실행 명령을 확인한다.
- ✅ 기존 패키지 관리자, 디렉터리, config, fixture, 환경변수 계약을 우선 재사용한다.
- ✅ `@playwright/test` 설치와 Chromium 다운로드는 각각 실행 전에 사용자의 명시적 동의를 받는다.
- ✅ 테스트는 localhost 또는 사용자가 비운영이라고 확인한 개발·스테이징 환경에서만 실행한다.
- ⛔ 운영 환경에서 실행하지 않는다. 비운영 여부가 불분명한 원격 URL도 확인 전에는 실행하지 않는다.
- ⛔ 테스트 통과를 위해 제품 코드, API, 데이터베이스 schema를 수정하지 않는다.
- ⛔ 비밀정보, 실제 개인정보, 고정 대기, 새 CSS/XPath selector를 테스트에 넣지 않는다.
- ⛔ Page Object, 공용 fixture, CI, 다중 브라우저는 사용자가 요청하거나 프로젝트가 이미 쓰지 않으면 추가하지 않는다.

## Workflow

1. 대상 흐름을 파악한다.
   - 대상 웹 앱의 `package.json`과 실행 명령이 있는 package root, 시작 URL, 사전 상태, 사용자 행동, 관찰 가능한 성공 결과와 데이터 정리 조건을 코드에서 찾는다.
   - 확정할 수 없는 항목만 사용자에게 묻는다.
   - 원격 URL이면 비운영 환경인지 확인한다. 운영이면 spec 작성은 가능하지만 실행 결과를 `미검증`으로 남긴다.

2. 로컬 Playwright 구성을 확인한다.
   - 전역 설치나 `playwright-cli`는 프로젝트 의존성으로 간주하지 않는다.
   - 대상 웹 앱의 `package.json`에 `@playwright/test`가 없으면 다른 파일을 수정하기 전에 `request_user_input`으로 설치 여부를 묻는다. 사용할 수 없으면 짧은 질문 하나로 묻는다.
   - "필요한 것은 알아서 설치" 같은 포괄적 허용도 이 전용 확인을 대신하지 않는다.
   - 거절하면 어떤 파일도 만들지 않고 `@playwright/test`가 필요하다고 안내한 뒤 중단한다.
   - 동의하면 lockfile과 기존 명령에 맞춰 아래 하나만 실행한다. lockfile이 충돌하면 임의로 고르지 말고 묻는다.

   | 감지 기준 | 설치 명령 | 실행 접두어 |
   |---|---|---|
   | `pnpm-lock.yaml` | `pnpm add -D @playwright/test` | `pnpm exec playwright` |
   | `yarn.lock` | `yarn add -D @playwright/test` | `yarn playwright` |
   | `bun.lock` 또는 `bun.lockb` | `bun add -d @playwright/test` | `bunx playwright` |
   | `package-lock.json`, `npm-shrinkwrap.json` 또는 lockfile 없음 | `npm install -D @playwright/test` | `npx playwright` |

3. Chromium 설치 여부를 확인한다.
   - 로컬 패키지에서 얻은 `chromium.executablePath()`가 실제 파일인지 확인한다.
   - 없으면 Chromium 다운로드 여부를 별도로 묻는다. 거절하면 config와 spec을 만들거나 보존할 수 있지만 실행하지 않고 `미검증`으로 보고한다.
   - 동의하면 위 표의 실행 접두어로 `playwright install chromium`만 실행한다. Linux 시스템 패키지가 필요하면 `--with-deps` 실행 전에 별도 권한을 받는다.

4. 최소 실행 세트를 작성한다.
   - 기존 config와 테스트 위치가 있으면 그 구조를 유지한다.
   - 기존 위치가 없으면 대상 웹 앱 package root에 `playwright.config.ts`와 `e2e/<flow>.spec.ts`를 둔다. 단일 프로젝트는 저장소 루트, 모노레포는 `apps/<app>/`처럼 해당 앱의 `package.json`이 있는 디렉터리가 기준이다.
   - 모노레포 루트가 기존 E2E 실행을 소유하지 않으면 특정 앱의 config·spec·의존성을 루트에 두지 않는다.
   - config에는 `testDir`, 확인된 `baseURL`, Chromium, 실패 시 trace·screenshot에 필요한 최소 옵션만 둔다. package script는 요청이 없으면 추가하지 않는다.
   - locator는 `getByRole` → `getByLabel` → 기존 `getByTestId` 순서로 고른다. 제품에 안정적인 locator가 없으면 제품 코드를 고치지 말고 차단 사유를 보고한다.
   - `waitForTimeout` 대신 Playwright의 자동 대기와 web-first assertion을 사용한다.
   - 계정과 레코드는 테스트 전용 값을 사용하고 반복 실행 시 충돌하지 않게 고유 값을 만든다.

```ts
import { expect, test } from '@playwright/test';

test('회원가입을 완료한다', async ({ page }) => {
  const email = `e2e-${crypto.randomUUID()}@example.test`;
  const password = process.env.E2E_SIGNUP_PASSWORD;
  if (!password) throw new Error('E2E_SIGNUP_PASSWORD가 필요합니다.');

  await page.goto('/signup');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('checkbox', { name: '약관 동의' }).check();
  await page.getByRole('button', { name: '가입하기' }).click();

  await expect(page.getByRole('heading', { name: '가입 완료' })).toBeVisible();
});
```

5. 대상 spec만 실행한다.
   - 위 표의 실행 접두어에 `test <spec 경로> --project=chromium`을 붙여 실행한다.
   - 앱 실행법이 기존 config나 package script로 확정되면 재사용한다. 확정할 수 없으면 실행 명령 또는 실행 중인 비운영 URL을 묻는다.
   - CAPTCHA, OTP, 메일 인증, 외부 OAuth는 기존 테스트용 우회 계약이나 테스트 inbox가 있을 때만 자동화한다. 없으면 해당 경계를 보고하고 추측 구현하지 않는다.

6. 실패를 분류한다.
   - spec·locator·assertion·config 문제면 최소한으로 고치고 같은 spec을 다시 실행한다.
   - 제품 결함이나 접근 가능한 이름 누락이면 제품 코드를 건드리지 않고 실패 단계와 Playwright 근거를 보고한다.
   - 외부 서비스, 환경변수, 테스트 데이터 준비가 빠졌으면 필요한 입력을 정확히 보고하고 중단한다.

7. 산출물을 정리한다.
   - `playwright-report/`, `test-results/`가 기존 ignore 규칙에 없을 때만 `.gitignore`에 추가한다.
   - 사용자 변경과 관계없는 파일은 수정하지 않는다.

## Completion Gate

다음을 모두 만족해야 `검증 완료`로 보고한다.

- 대상 spec 실행이 exit 0이다.
- 운영 환경 실행, 비밀정보 기록, 제품 코드 변경이 없다.
- 관련 없는 config, fixture, CI, package script를 추가하지 않았다.
- 실행하지 못한 단계는 성공으로 표현하지 않고 `미검증`과 이유를 명시했다.

## Output

- 생성·수정한 E2E 파일
- 실제 실행한 명령과 결과
- 발견한 제품 결함 또는 외부 차단 요인
- 실행하지 못한 범위와 이유
