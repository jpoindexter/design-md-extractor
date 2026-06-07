export type GuiRunInput = {
  url: string;
  maxPages: number;
  /** Cookie file (Playwright JSON or Netscape cookies.txt) to inject for Cloudflare/login-walled sites. */
  cookies?: string;
  /** User-Agent matching the browser that produced the cookies (so cf_clearance validates). */
  userAgent?: string;
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
    tokensCss?: string;
    tailwindTheme?: string;
    designTokens?: string;
    aiPrompt?: string;
  };
  summary: {
    source: {
      primaryUrl: string;
      capturedAt: string;
    };
    styleThesis: string;
    bestScreenshotHref: string | null;
    pages: Array<{ url: string; status: string; error?: string }>;
    colors: Array<{
      name: string;
      value: string;
      cssVariable?: string;
      role: string;
      confidence: string;
    }>;
    typography: Array<{
      role: string;
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      letterSpacing: string;
      confidence: string;
    }>;
    spacing: Array<{ name: string; value: string; confidence: string }>;
    radii: Array<{ name: string; value: string; confidence: string }>;
    shadows: Array<{ name: string; value: string; confidence: string }>;
    surfaces: Array<{
      level: number;
      name: string;
      value: string;
      purpose: string;
      confidence: string;
    }>;
    warnings: Array<{
      code: string;
      message: string;
      severity: 'info' | 'warning' | 'error';
    }>;
    components: Array<{
      name: string;
      kind: string;
      role: string;
      textSample?: string;
      selector?: string;
      count: number;
      styles?: Record<string, string>;
      bounds?: { width: number; height: number };
      confidence: string;
    }>;
    screenshots: Array<{
      viewport: string;
      url: string;
      path: string;
      href: string;
    }>;
    gradients?: Array<{ name: string; value: string; confidence: string }>;
    layout?: {
      density: string;
      containerWidths?: number[];
      sectionGaps?: string[];
    };
    imagery?: { strategy: string; notes?: string[] };
    motion?: { durations: string[]; easings: string[] };
    interactionStates?: Array<{
      state: string;
      selector: string;
      declarations: Record<string, string>;
      source?: string;
    }>;
  };
};

export type GuiRunner = (input: GuiRunInput) => Promise<GuiRunResult>;
