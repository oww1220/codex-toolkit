/**
 * Dashboard.tsx — 대시보드 대표 화면. content.json 의 dashboard 데이터만 받고,
 * 스타일은 전적으로 --dd-* 변수(=현재 후보 토큰)로만 표현한다.
 */

import type { Candidate, Content } from "../types";
import { Shell } from "./shared";

interface Props {
  content: Content;
  candidate: Candidate;
}

const TREND_CLASS: Record<NonNullable<Content["dashboard"]["metrics"][number]["trend"]>, string> = {
  up: "dd-trend-up",
  down: "dd-trend-down",
  flat: "dd-trend-flat",
};

export function Dashboard({ content, candidate }: Props) {
  const d = content.dashboard;
  const fluid = candidate.layout.contentWidth === "fluid";
  const mono = candidate.id === "candidate-e"; // 기술형 후보는 수치 모노

  return (
    <Shell candidate={candidate} app={content.app} activeKey="dashboard" fluid={fluid}>
      <div className="dd-page-head">
        <h1 className="dd-h1">{d.title}</h1>
        <p className="dd-sub">{d.subtitle}</p>
      </div>

      <div className="dd-metrics">
        {d.metrics.map((m) => (
          <div className="dd-metric" key={m.label}>
            <div className="dd-metric__label">{m.label}</div>
            <div className={"dd-metric__value" + (mono ? " dd-metric__value--mono" : "")}>
              {m.value}
            </div>
            {m.delta && (
              <div className={"dd-metric__delta " + (m.trend ? TREND_CLASS[m.trend] : "")}>
                {m.trend === "up" ? "▲" : m.trend === "down" ? "▼" : "–"} {m.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="dd-grid-2">
        <section className="dd-panel">
          <header className="dd-panel__head">{d.activityTitle}</header>
          <div className="dd-panel__body">
            <div className="dd-activity">
              {d.activity.map((a, i) => (
                <div className="dd-activity__item" key={i}>
                  <span className="dd-activity__time">{a.time}</span>
                  <span>{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dd-panel">
          <header className="dd-panel__head">처리 대기</header>
          <div className="dd-panel__body">
            <p className="dd-body-text" style={{ marginTop: 0 }}>
              견적 검토 3건, 청구 발송 2건이 대기 중입니다. 가장 오래된 항목부터 처리하세요.
            </p>
            <div className="dd-actions" style={{ marginTop: "var(--dd-space-3)" }}>
              <button className="dd-btn dd-btn--primary" type="button">
                대기 항목 보기
              </button>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}
