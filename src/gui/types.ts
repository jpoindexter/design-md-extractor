export type GuiRunInput = {
  url: string;
  maxPages: number;
};

export type GuiRunResult = {
  runId: string;
  url: string;
  outDir: string;
  discoveredPages: string[];
  artifacts: {
    designMd: string;
    evidenceJson: string;
    previewHtml: string;
  };
  summary: {
    pages: Array<{ url: string; status: string; error?: string }>;
    colors: Array<{ name: string; value: string; role: string; confidence: string }>;
    typography: Array<{ role: string; fontFamily: string; fontSize: string; fontWeight: string; confidence: string }>;
    components: Array<{ name: string; kind: string; role: string; count: number; confidence: string }>;
    screenshots: Array<{ viewport: string; url: string; path: string; href: string }>;
  };
};

export type GuiRunner = (input: GuiRunInput) => Promise<GuiRunResult>;
