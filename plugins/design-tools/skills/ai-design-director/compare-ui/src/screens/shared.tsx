/**
 * shared.tsx — 화면 컴포넌트들이 공유하는 목업 셸/배지.
 *
 * Shell 은 candidate.layout.navigation 에 따라 좌측 사이드바 / 아이콘 레일 / 상단바를 그린다
 * (후보 간 *구조* 차이가 같은 콘텐츠 위에서 드러나도록). 콘텐츠는 항상 content.json 에서 온다.
 */

import type { ReactNode } from "react";
import type { AppMeta, Candidate, RowStatus } from "../types";

/** 상태 → 의미색 변수 + 한국어 라벨. 색에만 의존하지 않게 항상 텍스트와 함께 쓴다. */
const STATUS_META: Record<RowStatus, { varName: string; label: string }> = {
  active: { varName: "--dd-success", label: "진행중" },
  pending: { varName: "--dd-warning", label: "대기" },
  overdue: { varName: "--dd-danger", label: "연체" },
  archived: { varName: "--dd-text-muted", label: "보관" },
};

export function StatusBadge({ status }: { status: RowStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="dd-badge"
      style={{
        color: `var(${meta.varName})`,
        background: "var(--dd-bg-subtle)",
        border: "var(--dd-border-width) solid var(--dd-border-subtle)",
      }}
    >
      {meta.label}
    </span>
  );
}

/** 추상 점선/네모 아이콘 — figural 금지, 내비게이션 항목 표식용 단순 도형. */
function NavGlyph() {
  return (
    <svg className="dd-ico" viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="11"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.7"
      />
    </svg>
  );
}

interface ShellProps {
  candidate: Candidate;
  app: AppMeta;
  activeKey: string;
  /** 전역 검색 placeholder. */
  children: ReactNode;
  /** content padding 을 fluid 로 둘지. */
  fluid?: boolean;
}

/** 내비게이션 구조를 후보 layout 에 맞춰 렌더하는 목업 셸. */
export function Shell({ candidate, app, activeKey, children, fluid }: ShellProps) {
  const nav = candidate.layout.navigation;
  const initials = app.userName.slice(0, 1);

  const navItems = (rail: boolean) => (
    <nav className="dd-nav">
      {app.nav.map((item) => (
        <a
          key={item.key}
          className={"dd-nav__item" + (item.key === activeKey ? " is-active" : "")}
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-current={item.key === activeKey ? "page" : undefined}
          title={item.label}
        >
          <NavGlyph />
          {!rail && <span className="dd-nav__label">{item.label}</span>}
        </a>
      ))}
    </nav>
  );

  const header = (
    <div className="dd-header">
      <input
        className="dd-search"
        placeholder={app.searchPlaceholder}
        aria-label="검색"
      />
      <span style={{ flex: 1 }} />
      <span className="dd-avatar" aria-hidden="true">
        {initials}
      </span>
    </div>
  );

  if (nav === "top-bar" || nav === "top-bar-with-subnav") {
    return (
      <div className="dd-app dd-app--top">
        <div className="dd-topbar">
          <span className="dd-brand">{app.productName}</span>
          <div className="dd-topbar__nav">
            {app.nav.slice(0, 5).map((item) => (
              <a
                key={item.key}
                className={"dd-nav__item" + (item.key === activeKey ? " is-active" : "")}
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-current={item.key === activeKey ? "page" : undefined}
              >
                <span className="dd-nav__label">{item.label}</span>
              </a>
            ))}
          </div>
          <span style={{ flex: 1 }} />
          <input
            className="dd-search"
            placeholder={app.searchPlaceholder}
            aria-label="검색"
            style={{ maxWidth: 220 }}
          />
          <span className="dd-avatar" aria-hidden="true">
            {initials}
          </span>
        </div>
        <main className="dd-main">
          <div className={"dd-content" + (fluid ? " dd-content--fluid" : "")}>{children}</div>
        </main>
      </div>
    );
  }

  const rail = nav === "compact-icon-rail";
  return (
    <div className={"dd-app " + (rail ? "dd-app--rail" : "dd-app--sidebar")}>
      <aside className={"dd-side" + (rail ? " dd-side--rail" : "")}>
        {!rail && <span className="dd-brand">{app.productName}</span>}
        {rail && (
          <span
            className="dd-avatar"
            aria-hidden="true"
            style={{ marginBottom: "var(--dd-space-3)" }}
          >
            {app.productName.slice(0, 1)}
          </span>
        )}
        {navItems(rail)}
      </aside>
      <main className="dd-main">
        {header}
        <div className={"dd-content" + (fluid ? " dd-content--fluid" : "")}>{children}</div>
      </main>
    </div>
  );
}
