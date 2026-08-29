# 읽기 쉬운 TypeScript/NestJS 주석 예시

JavaScript, TypeScript, NestJS에서 참고한다. 타입과 코드를 문장으로 반복하지 말고, 호출 계약과 숨은 상태 변화만 설명한다.

## 필수 적용 범위

- 모듈·공유 interface/type·class·decorator 대상과 공개 함수·메서드의 역할·경계
- 모든 `@param`, 구조화된 options 속성, 반환값, 실제 throw/reject 조건
- 목적이 숨은 지역 변수와 모든 조건·조기 반환·삼항식·switch·반복·catch/finally 경로
- Promise·외부 호출의 순서, 변경 상태, 오류 변환·재전파와 cleanup
- NestJS Controller·Guard 이후 요청 계약, Service 정책, Entity 필드·관계·nullable·인덱스·삭제 규칙

대상 코드에 존재하는 항목은 모두 점검 목록에 넣고 선언 또는 실행 경로 가까이에 설명한다.

## 비동기 함수와 내부 흐름

```ts
/**
 * 회원가입 완료까지 세션에 보관하는 일회성 소셜 연동 식별값이다.
 *
 * 회원 판정용 정보와 access token은 포함하지 않는다.
 */
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
 * @returns 연동이 없거나 저장 시도가 끝나면 완료되는 작업. 저장 실패는 외부로 전파하지 않는다.
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
- 타입에는 사용 범위와 포함하면 안 되는 정보만 설명했다.
- `pendingLink`는 값의 출처와 수명이 숨겨져 있어 선언 가까이에 설명했다.
- 저장 후 세션 삭제 순서는 데이터 손실과 연결되므로 이유를 남겼다.
- `memberId`, `error`, 객체 속성처럼 이름과 타입으로 충분한 값은 반복 설명하지 않았다.

## 공유 인터페이스 계약

```ts
/**
 * 제공자별 OAuth 차이를 숨기고 로그인 판정에 필요한 최소 프로필을 조회한다.
 *
 * 인가 코드 교환과 외부 프로필 조회까지만 담당한다. 회원 조회·가입·화면 이동은
 * 호출 서비스의 책임이며 access token은 구현 밖으로 반환하지 않는다.
 */
export interface SocialAuthClient {
  /** 이 클라이언트가 처리하는 제공자 코드. 연동 저장값과 구현 선택에 사용한다. */
  readonly provider: SocialProvider

  /**
   * 콜백 값을 검증하고 외부 프로필을 최소 판정 정보로 변환한다.
   *
   * @param code 제공자 콜백으로 전달된 일회성 인가 코드.
   * @param state 요청 시 보관한 값과 대조할 CSRF 방지 상태값.
   * @returns 외부 계정 식별자와 제공된 선택 정보만 담은 프로필.
   * @throws SocialAuthError 콜백 검증·토큰 교환·프로필 조회 중 하나라도 실패한 경우.
   */
  fetchProfile(code: string, state: string): Promise<SocialProfile>
}
```

### 가독성이 좋은 이유

- 인터페이스에는 구현체가 공통으로 지켜야 할 역할과 책임 경계를 적었다.
- 속성에는 타입만으로 드러나지 않는 사용처를 설명했다.
- 메서드에는 입력 출처, 반환 범위, 실패 조건을 모았다.

## NestJS 요청 경계와 서비스 정책

```ts
/** 인증된 회원의 소셜 연동 해제 요청을 서비스 정책으로 전달하는 HTTP 경계다. */
@Controller('social-links')
export class SocialLinkController {
  /**
   * @param socialLinkService 회원 소유권 확인과 연동 삭제를 수행할 애플리케이션 서비스.
   */
  constructor(private readonly socialLinkService: SocialLinkService) {}

  /**
   * 로그인 회원이 소유한 소셜 연동을 해제한다.
   *
   * 회원 식별은 인증 Guard가 끝낸 뒤 전달하며, 경로 ID는 UUID 형식을 먼저 검증한다.
   *
   * @param memberId 인증 Guard가 확인한 현재 회원 ID.
   * @param linkId URL 경로에서 받은 해제 대상 연동 ID.
   * @returns 응답 본문 없이 해제 완료 시점에 끝나는 작업.
   * @throws NotFoundException 현재 회원이 소유한 연동을 찾지 못한 서비스 실패가 전파된 경우.
   */
  @Delete(':linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentMemberId() memberId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
  ): Promise<void> {
    return this.socialLinkService.remove(memberId, linkId)
  }
}

/** 회원 소유권을 노출하지 않으면서 소셜 연동 삭제 정책을 수행한다. */
@Injectable()
export class SocialLinkService {
  /**
   * @param repository 회원과 연동 ID를 함께 제한해 조회·삭제할 저장소.
   */
  constructor(private readonly repository: SocialLinkRepository) {}

  /**
   * 회원 소유권이 확인된 연동만 삭제한다.
   *
   * 다른 회원의 연동 존재 여부를 노출하지 않도록 회원 ID와 연동 ID를 함께 조회한다.
   *
   * @param memberId 연동 소유권을 제한할 현재 회원 ID.
   * @param linkId 삭제할 연동 ID.
   * @returns 소유권이 확인된 연동 삭제가 끝나면 완료되는 작업.
   * @throws NotFoundException 현재 회원이 소유한 연동을 찾지 못한 경우.
   */
  async remove(memberId: string, linkId: string): Promise<void> {
    const link = await this.repository.findOwnedLink(memberId, linkId)

    // 없음과 타 회원 소유를 같은 결과로 처리해 계정 연결 정보 노출을 막는다.
    if (!link) throw new NotFoundException('연동 정보를 찾을 수 없습니다.')

    await this.repository.remove(link)
  }
}
```

### 가독성이 좋은 이유

- Controller에는 요청값의 출처·검증과 HTTP 완료 계약만 남겼다.
- Service에는 소유권 판정 이유와 실제 예외 조건을 설명했다.
- decorator 문법은 반복하지 않고 클래스·주입 의존성의 실제 책임을 설명했다.

## NestJS 엔티티의 저장 계약

```ts
/**
 * 회원과 외부 제공자 계정의 연동 관계를 저장한다.
 *
 * 로그인 판정에 필요한 식별값만 보관하며 access token은 저장하지 않는다.
 * 제공자 안에서 같은 외부 계정이 여러 회원에게 연결되지 않도록 고유성을 보장한다.
 */
@Entity('social_link')
@Index(['provider', 'externalUserId'], { unique: true })
export class SocialLinkEntity {
  /** 연동 레코드를 내부에서 참조하는 UUID 식별자. */
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** 연동을 소유한 회원 ID. 회원 삭제 시 연동도 함께 제거된다. */
  @Column('uuid')
  memberId: string

  /** 회원 삭제 정책을 적용하고 회원 기준 연동 조회에 사용하는 관계. */
  @ManyToOne(() => MemberEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity

  /** 외부 계정 식별값의 해석 범위를 결정하는 제공자 코드. */
  @Column()
  provider: SocialProvider

  /** 제공자 안에서 계정을 식별하는 값. 이메일이나 access token이 아니다. */
  @Column()
  externalUserId: string

  /** 연동 당시 받은 참고용 이메일. 미제공이면 null이며 로그인 식별에는 쓰지 않는다. */
  @Column({ nullable: true })
  linkedEmail: string | null

  /** 연동이 처음 저장된 시각. 재인가 시각으로 갱신하지 않는다. */
  @CreateDateColumn()
  createdAt: Date
}
```

### 가독성이 좋은 이유

- 클래스에는 저장 책임, 고유성, 민감한 토큰 비보관 정책을 모았다.
- 모든 영속 필드에는 도메인 의미와 관계·nullable·수명 정책을 적었다.
- decorator가 이미 보여주는 DB 타입을 한국어로 반복하지 않았다.

## 그대로 복제하지 않을 것

- 타입 이름과 반환형을 되풀이하는 JSDoc
- 프로젝트마다 다른 Guard·decorator·경로·상태 코드를 그대로 복제하는 예시
- 확인하지 않은 테이블명·고유 조건·cascade 정책을 그대로 복제하는 엔티티
- 실제 호출자에서 확인하지 않은 캐시 갱신·화면 이동·재시도 정책
