#!/usr/bin/env node
import { parseExtractArgs } from './config/parseArgs.js';

async function main(): Promise<void> {
  const config = parseExtractArgs(process.argv.slice(2));
  console.log(JSON.stringify(config, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
