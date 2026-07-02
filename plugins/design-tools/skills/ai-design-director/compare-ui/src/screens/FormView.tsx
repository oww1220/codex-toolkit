/**
 * FormView.tsx — 폼 대표 화면. 섹션 단위 필드 그룹 + 도움말(색 아닌 텍스트로 상태 전달) +
 * 1·2차 액션. 레이블·입력 연결(label htmlFor)로 접근성 확보.
 */

import type { Candidate, Content, FormFieldDef } from "../types";
import { Shell } from "./shared";

interface Props {
  content: Content;
  candidate: Candidate;
}

function Field({ field }: { field: FormFieldDef }) {
  const id = `f-${field.name}`;
  const full = field.type === "textarea";
  return (
    <div className={full ? "dd-field-full" : undefined}>
      <label className="dd-label" htmlFor={id}>
        {field.label}
        {field.required && (
          <span className="dd-req" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {field.type === "select" ? (
        <select id={id} className="dd-select" defaultValue="">
          <option value="" disabled>
            선택하세요
          </option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea id={id} className="dd-textarea" placeholder={field.placeholder} />
      ) : (
        <input
          id={id}
          className="dd-input"
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
          placeholder={field.placeholder}
        />
      )}

      {field.hint && <div className="dd-hint">{field.hint}</div>}
    </div>
  );
}

export function FormView({ content, candidate }: Props) {
  const form = content.form;
  const fluid = candidate.layout.contentWidth === "fluid";

  return (
    <Shell candidate={candidate} app={content.app} activeKey="form" fluid={fluid}>
      <div className="dd-page-head">
        <h1 className="dd-h1">{form.title}</h1>
        <p className="dd-sub">{form.subtitle}</p>
      </div>

      <form className="dd-form" onSubmit={(e) => e.preventDefault()}>
        {form.sections.map((section) => (
          <div className="dd-form-section" key={section.heading}>
            <h2 className="dd-form-section__heading">{section.heading}</h2>
            <div className="dd-form-grid">
              {section.fields.map((f) => (
                <Field key={f.name} field={f} />
              ))}
            </div>
          </div>
        ))}

        <div className="dd-form-foot">
          <button className="dd-btn dd-btn--primary" type="submit">
            {form.submitLabel}
          </button>
          <button className="dd-btn" type="button">
            {form.cancelLabel}
          </button>
        </div>
      </form>
    </Shell>
  );
}
