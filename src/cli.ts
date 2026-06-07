#!/usr/bin/env node
import { parseExtractArgs } from './config/parseArgs.js';
import { runExtraction } from './crawl/runExtraction.js';

async function main(): Promise<void> {
  const config = parseExtractArgs(process.argv.slice(2));
  for (const warning of config.sessionWarnings ?? []) {
    console.warn(`warning: ${warning}`);
  }
  await runExtraction(config);
  console.log(`Design artifacts written to ${config.outDir}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
