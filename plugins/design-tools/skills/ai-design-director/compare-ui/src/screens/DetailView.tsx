/**
 * DetailView.tsx — 상세 대표 화면. 속성 필드 + 메모 + 거래 내역(작은 표) + 1·2차 액션.
 * 상태는 색+텍스트로 함께 표기(색에만 의존 금지 — Gate 7 접근성).
 */

import type { Candidate, Content } from "../types";
import { Shell, StatusBadge } from "./shared";

interface Props {
  content: Content;
  candidate: Candidate;
}

export function DetailView({ content, candidate }: Props) {
  const d = content.detail;
  const fluid = candidate.layout.contentWidth === "fluid";

  return (
    <Shell candidate={candidate} app={content.app} activeKey="detail" fluid={fluid}>
      <div
        className="dd-page-head"
        style={{ display: "flex", alignItems: "center", gap: "var(--dd-space-3)" }}
      >
        <div style={{ flex: 1 }}>
          <h1 className="dd-h1">{d.title}</h1>
          <p className="dd-sub" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={d.status} />
            거래 중인 고객
          </p>
        </div>
      </div>

      <div className="dd-detail-grid">
        <section className="dd-panel">
          <header className="dd-panel__head">고객 정보</header>
          <div className="dd-panel__body">
            <div className="dd-fields">
              {d.fields.map((f) => (
                <div key={f.label}>
                  <div className="dd-field__label">{f.label}</div>
                  <div className="dd-field__value">{f.value}</div>
                </div>
              ))}
            </div>

            <h3
              className="dd-panel__head"
              style={{
                border: "none",
                padding: "var(--dd-space-4) 0 var(--dd-space-1)",
              }}
            >
              {d.bodyTitle}
            </h3>
            <p className="dd-body-text" style={{ marginTop: 0 }}>
              {d.body}
            </p>

            <div className="dd-actions">
              <button className="dd-btn dd-btn--primary" type="button">
                {d.primaryAction}
              </button>
              <button className="dd-btn" type="button">
                {d.secondaryAction}
              </button>
            </div>
          </div>
        </section>

        <section className="dd-panel">
          <header className="dd-panel__head">{d.timelineTitle}</header>
          <div className="dd-panel__body">
            <div className="dd-mini-timeline">
              {d.timeline.map((t, i) => (
                <div className="dd-mini-timeline__item" key={i}>
                  <span className="dd-mini-timeline__time">{t.time}</span>
                  <span>{t.text}</span>
                  <span className="dd-mini-timeline__num">{t.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}
