/**
 * theme.ts — Candidate 토큰을 CSS custom properties(인라인 style 객체)로 변환.
 *
 * 후보 미리보기 프레임(ViewportFrame)의 root 에 이 변수들을 주입하면, 그 안의 화면 컴포넌트는
 * 오직 CSS 변수(var(--dd-*))만으로 스타일된다 → 토큰만 갈아끼우면 모든 후보가 표현된다.
 * 도구 셸(Toolbar 등)의 색은 별도이며 후보 화면 안으로 새지 않게 격리한다.
 */

import type { Candidate, ColorMode, ColorScheme } from "./types";

// React.CSSProperties 가 임의 --커스텀 변수를 허용하지 않으므로 별도 타입을 둔다.
export type CSSVars = Record<`--${string}`, string>;

const SHADOW_MAP: Record<Candidate["shape"]["shadow"], { sm: string; md: string; lg: string }> = {
  none: { sm: "none", md: "none", lg: "none" },
  subtle: {
    sm: "0 1px 1px rgba(15, 18, 28, 0.05)",
    md: "0 2px 6px rgba(15, 18, 28, 0.07)",
    lg: "0 6px 16px rgba(15, 18, 28, 0.09)",
  },
  medium: {
    sm: "0 1px 2px rgba(15, 18, 28, 0.08)",
    md: "0 4px 12px rgba(15, 18, 28, 0.12)",
    lg: "0 12px 28px rgba(15, 18, 28, 0.16)",
  },
  strong: {
    sm: "0 2px 4px rgba(15, 18, 28, 0.14)",
    md: "0 8px 20px rgba(15, 18, 28, 0.20)",
    lg: "0 18px 40px rgba(15, 18, 28, 0.26)",
  },
};

/** density → 행 높이/패딩 스케일 보조 배수. */
const DENSITY_PAD: Record<Candidate["spacing"]["density"], number> = {
  compact: 0.75,
  comfortable: 1,
  spacious: 1.35,
};

function colorVars(c: ColorScheme): CSSVars {
  return {
    "--dd-bg-base": c.bgBase,
    "--dd-bg-subtle": c.bgSubtle,
    "--dd-bg-muted": c.bgMuted,
    "--dd-surface": c.surfaceDefault,
    "--dd-surface-raised": c.surfaceRaised,
    "--dd-surface-sunken": c.surfaceSunken,
    "--dd-text": c.textPrimary,
    "--dd-text-secondary": c.textSecondary,
    "--dd-text-muted": c.textMuted,
    "--dd-text-inverse": c.textInverse,
    "--dd-border": c.borderDefault,
    "--dd-border-strong": c.borderStrong,
    "--dd-border-subtle": c.borderSubtle,
    "--dd-accent": c.accentDefault,
    "--dd-accent-hover": c.accentHover,
    "--dd-accent-subtle": c.accentSubtle,
    "--dd-accent-contrast": c.accentContrast,
    "--dd-success": c.success,
    "--dd-success-surface": c.successSurface,
    "--dd-warning": c.warning,
    "--dd-warning-surface": c.warningSurface,
    "--dd-danger": c.danger,
    "--dd-danger-surface": c.dangerSurface,
    "--dd-info": c.info,
    "--dd-info-surface": c.infoSurface,
  };
}

/**
 * 후보 + 라이트/다크 모드를 받아 미리보기 root 에 주입할 CSS 변수 맵을 만든다.
 */
export function candidateToCssVars(candidate: Candidate, mode: ColorMode): CSSVars {
  const scheme = mode === "dark" ? candidate.color.dark : candidate.color.light;
  const t = candidate.typography;
  const s = candidate.shape;
  const sp = candidate.spacing;
  const shadow = SHADOW_MAP[s.shadow];
  const u = sp.unit; // 4 | 6 | 8 ...
  const pad = DENSITY_PAD[sp.density];

  const sizeBase = t.baseSize;
  const sz = (mult: number) => `${Math.round(sizeBase * mult)}px`;

  return {
    ...colorVars(scheme),

    // typography
    "--dd-font-display": t.fontDisplay,
    "--dd-font-body": t.fontBody,
    "--dd-font-mono": t.fontMono,
    "--dd-size-xs": sz(Math.pow(t.scale, -2)),
    "--dd-size-sm": sz(Math.pow(t.scale, -1)),
    "--dd-size-base": sz(1),
    "--dd-size-lg": sz(t.scale),
    "--dd-size-xl": sz(Math.pow(t.scale, 2)),
    "--dd-size-2xl": sz(Math.pow(t.scale, 3)),
    "--dd-size-3xl": sz(Math.pow(t.scale, 4)),
    "--dd-weight-display": String(t.displayWeight),
    "--dd-weight-body": String(t.bodyWeight),
    "--dd-tracking-heading": `${t.headingTracking}em`,
    "--dd-leading-body": String(t.bodyLineHeight),

    // shape
    "--dd-radius": `${s.radius}px`,
    "--dd-radius-lg": `${s.radiusLarge}px`,
    "--dd-border-width": `${s.borderWidth}px`,
    "--dd-shadow-sm": shadow.sm,
    "--dd-shadow-md": shadow.md,
    "--dd-shadow-lg": shadow.lg,

    // spacing (4px 기반 스케일)
    "--dd-space-1": `${u}px`,
    "--dd-space-2": `${u * 2}px`,
    "--dd-space-3": `${u * 3}px`,
    "--dd-space-4": `${u * 4}px`,
    "--dd-space-6": `${u * 6}px`,
    "--dd-space-8": `${u * 8}px`,
    "--dd-row-pad-y": `${Math.round(u * 2 * pad)}px`,
    "--dd-row-pad-x": `${u * 3}px`,
    "--dd-control-h": `${Math.round(36 * pad + (sizeBase - 15) * 2)}px`,

    // motion
    "--dd-duration": candidate.motion.level === "none" ? "0ms" : `${candidate.motion.durationMs}ms`,
  };
}

/** 상태 라벨 → 의미 색 변수 키 매핑 (색에만 의존하지 않게 텍스트도 함께 쓰는 곳에서 참조). */
export const STATUS_VAR: Record<
  "active" | "pending" | "overdue" | "archived",
  { fg: string; bg: string; label: string }
> = {
  active: { fg: "var(--dd-success)", bg: "var(--dd-success-surface)", label: "진행중" },
  pending: { fg: "var(--dd-warning)", bg: "var(--dd-warning-surface)", label: "대기" },
  overdue: { fg: "var(--dd-danger)", bg: "var(--dd-danger-surface)", label: "연체" },
  archived: { fg: "var(--dd-text-muted)", bg: "var(--dd-bg-muted)", label: "보관" },
};
