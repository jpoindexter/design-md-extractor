export function responsiveCss(): string {
  return `
    @media (max-width: 1220px) {
      body { overflow: auto; }
      .shell { height: auto; min-height: 100dvh; }
      main { overflow: hidden; }
      .result { height: auto; }
      .workspace { grid-template-columns: minmax(0, 1fr); height: auto; overflow: hidden; }
      .reference { height: auto; overflow: visible; overflow-x: hidden; border-right: 0; }
      .result-head h2 { font-size: 42px; }
      .result.site-themed .result-head h2 { font-size: 56px; }
      .export-pane {
        order: -1;
        height: 720px;
        max-height: calc(100vh - 24px);
      }
    }
    @media (max-width: 1320px) and (min-width: 961px) {
      form {
        grid-template-columns: minmax(180px, 1.2fr) minmax(132px, 0.6fr) minmax(132px, 0.6fr) 126px;
      }
      .run { padding-inline: 10px; }
    }
    @media (max-width: 960px) {
      .side {
        position: static;
        grid-template-columns: 1fr;
      }
      .brand { min-width: 0; }
      form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .result-head { display: grid; }
      .actions { justify-content: flex-start; }
    }
    @media (max-width: 760px) {
      main { padding: 0; overflow-x: hidden; }
      .result-head h2 { font-size: 34px; }
      .result.site-themed .result-head h2 { font-size: 38px; }
      .result.refero-layout .result-head h2 { font-size: 42px; }
      .preview-banner h4 { font-size: 34px; }
      .reference { padding: 18px; }
      .result.site-themed .reference,
      .result.refero-layout .reference {
        padding: 18px 12px 48px;
      }
      .result.refero-layout .panel + .panel { margin-top: 44px; }
      .tab-panel { padding: 12px; }
      .tabs,
      .export-actions,
      .downloads {
        padding-left: 12px;
        padding-right: 12px;
      }
      .workspace { border-radius: 0; }
      .hero-figure img { height: 260px; }
      form { grid-template-columns: minmax(0, 1fr); }
      .side { padding: 16px 12px; }
      .export-pane {
        height: 620px;
        max-height: calc(100vh - 24px);
      }
      .guidelines,
      .category-grid,
      .font-cards,
      .split-list,
      .tri-grid,
      .profile-grid,
      .preview-metrics,
      .downloads,
      .swatch-item:nth-child(1),
      .swatch-item:nth-child(2) {
        grid-template-columns: minmax(0, 1fr);
        grid-column: auto;
      }
    }
  `;
}
