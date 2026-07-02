---
name: figma-implementation-audit
description: >
  Use when comparing a Figma design link, frame, node, or screenshot against an implemented
  app screen, route, localhost page, or coded UI to check visual and interaction consistency.
  Trigger on "Figma link matches code", "design vs implementation", "피그마 정합성", "피그마 링크랑 화면
  비교", "구현 화면 QA". Skip when the user only wants to edit the Figma file or only wants generic
  frontend debugging without a design source.
---

# Figma Implementation Audit

Compare a Figma source against the real implemented screen. Report mismatches first; edit code only when the user explicitly asks for fixes.

## Rules

- Use Figma tools for `figma.com` links. If calling Figma MCP tools, load `figma:figma-use` first.
- Use a real browser for the implementation. Prefer Playwright/browser tooling over static code inspection.
- Check the requested viewport and state. If they are missing, use the current route/default desktop viewport and say so.
- Compare layout, spacing, typography, colors, assets, responsive behavior, and visible interactions.
- Separate confirmed mismatches from assumptions, missing state, unavailable assets, or blocked Figma/browser access.
- Do not claim parity from screenshots alone when DOM or computed styles are needed to explain the mismatch.
- Do not edit Figma. Do not edit code unless the request includes fixing.

## Workflow

1. Identify the Figma URL/node, target route, viewport, state, and whether this is audit-only or fix-and-verify.
2. Capture Figma evidence: screenshot/design context, frame size, visible annotations, tokens, and component intent.
3. Capture implementation evidence: live route screenshot plus DOM/computed styles for suspicious differences.
4. Compare by severity: blocking layout/state mismatch, visible visual mismatch, minor polish, or uncertain.
5. Report only actionable findings. Include expected Figma behavior, actual implementation, evidence, and likely file/selector when found.

## Output

- Start with `정합성 결과: pass | partial | fail | blocked`.
- List mismatches by severity.
- Include route, viewport, Figma node/frame, and verification method.
- If blocked, name the exact missing input or failed tool step.
