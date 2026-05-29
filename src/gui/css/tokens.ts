export function tokensCss(): string {
  return `
    :root {
      --ink: #13151b;
      --ink-strong: #000000;
      --on-accent: #ffffff;
      --muted: #525769;
      /* --quiet darkened from #777d90: that failed WCAG 1.4.3 (3.77-4.10:1) at the
         10-13px sizes it's used for. #646876 clears 4.5:1 on canvas/panel/rail. */
      --quiet: #646876;
      --line: #ededf2;
      --line-strong: #e0e2ea;
      --field-border: #8d92a1;
      --canvas: #ffffff;
      --paper: #ffffff;
      --panel: #f7f8fb;
      --rail: #f4f5fb;
      --accent: #0c2970;
      --accent-soft: #13151b;
      --error: #dc2626;
      --error-bg: #fef2f2;
      --serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
      --mono: "JetBrains Mono", "SFMono-Regular", Menlo, monospace;
      --card-shadow: rgba(12, 41, 112, 0.07) 0px 0px 0px 1px inset;
      --badge-high-bg: #e7f6ec;
      --badge-high-color: #1a7f4b;
      --badge-medium-bg: #fdf2e3;
      --badge-medium-color: #b45309;
      --badge-low-bg: #f0f1f5;
      --badge-low-color: #5f6477;
      --radius-sm: 4px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --radius-pill: 999px;
    }
  `;
}
