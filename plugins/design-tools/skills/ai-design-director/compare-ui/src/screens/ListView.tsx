/**
 * ListView.tsx — 목록 대표 화면. candidate.layout.listStyle 에 따라 테이블 / 카드 / 행 으로
 * 같은 데이터를 다르게 표현한다(시각 스타일 ↔ UX 구조 차이를 같은 콘텐츠 위에서 드러냄).
 */

import type { Candidate, Content, ListRow } from "../types";
import { Shell, StatusBadge } from "./shared";

interface Props {
  content: Content;
  candidate: Candidate;
}

function Toolrow({ list }: { list: Content["list"] }) {
  return (
    <div className="dd-toolrow">
      {list.filters.map((f, i) => (
        <button key={f} className={"dd-chip" + (i === 0 ? " is-active" : "")} type="button">
          {f}
        </button>
      ))}
      <input
        className="dd-search dd-toolrow__search"
        placeholder={list.searchPlaceholder}
        aria-label={list.searchPlaceholder}
        style={{ maxWidth: 240 }}
      />
    </div>
  );
}

function TableView({ list }: { list: Content["list"] }) {
  return (
    <div className="dd-table-wrap">
      <table className="dd-table">
        <thead>
          <tr>
            {list.columns.map((c, i) => (
              <th key={c} style={i === 2 ? { textAlign: "right" } : undefined}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.rows.map((r: ListRow) => (
            <tr key={r.id}>
              <td className="dd-table__name">{r.name}</td>
              <td style={{ color: "var(--dd-text-secondary)" }}>{r.category}</td>
              <td className="dd-table__num">{r.amount}</td>
              <td style={{ color: "var(--dd-text-muted)" }}>{r.date}</td>
              <td>
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardsView({ list }: { list: Content["list"] }) {
  return (
    <div className="dd-cards">
      {list.rows.map((r) => (
        <div className="dd-card-row" key={r.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{r.name}</strong>
            <StatusBadge status={r.status} />
          </div>
          <div style={{ color: "var(--dd-text-secondary)", fontSize: "var(--dd-size-sm)" }}>
            {r.category}
          </div>
          <div className="dd-row__num" style={{ fontWeight: 600 }}>
            {r.amount}
          </div>
          <div style={{ color: "var(--dd-text-muted)", fontSize: "var(--dd-size-xs)" }}>
            최근 거래 {r.date}
          </div>
        </div>
      ))}
    </div>
  );
}

function RowsView({ list }: { list: Content["list"] }) {
  return (
    <div className="dd-rows">
      {list.rows.map((r) => (
        <div className="dd-row" key={r.id}>
          <span className="dd-row__name">{r.name}</span>
          <span style={{ color: "var(--dd-text-muted)", width: 80 }}>{r.category}</span>
          <span className="dd-row__num" style={{ width: 110, textAlign: "right" }}>
            {r.amount}
          </span>
          <StatusBadge status={r.status} />
        </div>
      ))}
    </div>
  );
}

export function ListView({ content, candidate }: Props) {
  const list = content.list;
  const fluid = candidate.layout.contentWidth === "fluid";
  const style = candidate.layout.listStyle;

  return (
    <Shell candidate={candidate} app={content.app} activeKey="list" fluid={fluid}>
      <div className="dd-page-head">
        <h1 className="dd-h1">{list.title}</h1>
        <p className="dd-sub">{list.subtitle}</p>
      </div>
      <Toolrow list={list} />
      {style === "cards" ? (
        <CardsView list={list} />
      ) : style === "rows" ? (
        <RowsView list={list} />
      ) : (
        <TableView list={list} />
      )}
    </Shell>
  );
}
