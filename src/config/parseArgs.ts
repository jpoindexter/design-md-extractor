import { Command } from 'commander';
import { defaultViewports, type ViewportConfig } from './viewports.js';

export type ExtractConfig = {
  url: string;
  outDir: string;
  pages: string[];
  viewports: ViewportConfig[];
  maxComponents: number;
  preview: boolean;
  timeoutMs: number;
};

export function parseExtractArgs(argv: string[]): ExtractConfig {
  const program = new Command();
  program.exitOverride();
  program.name('design-md-extractor');

  let config: ExtractConfig | undefined;

  program
    .command('extract')
    .argument('<url>')
    .option('--out <directory>')
    .option('--pages <urls...>', 'additional URLs to inspect', [])
    .option('--viewports <list>', 'comma-separated viewport names', 'desktop,tablet,mobile')
    .option('--max-components <number>', 'maximum component samples', '80')
    .option('--no-preview', 'skip preview.html')
    .option('--timeout <ms>', 'page load timeout', '30000')
    .action((url: string, options: Record<string, unknown>) => {
      if (!String(options.out ?? '').trim()) {
        throw new Error('--out is required');
      }

      const selectedNames = String(options.viewports)
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      const selectedViewports = defaultViewports.filter((viewport) => selectedNames.includes(viewport.name));

      config = {
        url: new URL(url).toString(),
        outDir: String(options.out),
        pages: Array.isArray(options.pages) ? options.pages.map((page) => new URL(String(page)).toString()) : [],
        viewports: selectedViewports.length > 0 ? selectedViewports : defaultViewports,
        maxComponents: Number.parseInt(String(options.maxComponents), 10),
        preview: options.preview !== false,
        timeoutMs: Number.parseInt(String(options.timeout), 10),
      };
    });

  program.parse(argv, { from: 'user' });

  if (!config) {
    throw new Error('extract command is required');
  }

  return config;
}
