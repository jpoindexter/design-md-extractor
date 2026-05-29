import { execFile } from 'node:child_process';

export type DetectedCli = { id: string; label: string };

// Known AI / coding-assistant CLIs to probe for on PATH. `cmd` is the binary name.
const CLI_REGISTRY: Array<DetectedCli & { cmd: string }> = [
  { id: 'claude', label: 'Claude Code', cmd: 'claude' },
  { id: 'codex', label: 'Codex', cmd: 'codex' },
  { id: 'gemini', label: 'Gemini CLI', cmd: 'gemini' },
  { id: 'cursor', label: 'Cursor', cmd: 'cursor' },
  { id: 'aider', label: 'Aider', cmd: 'aider' },
  { id: 'opencode', label: 'opencode', cmd: 'opencode' },
  { id: 'amp', label: 'Amp', cmd: 'amp' },
  { id: 'goose', label: 'Goose', cmd: 'goose' },
  { id: 'q', label: 'Amazon Q', cmd: 'q' },
  { id: 'crush', label: 'Crush', cmd: 'crush' },
  { id: 'llm', label: 'llm', cmd: 'llm' },
  { id: 'ollama', label: 'Ollama', cmd: 'ollama' },
  { id: 'windsurf', label: 'Windsurf', cmd: 'windsurf' },
  { id: 'openai', label: 'OpenAI CLI', cmd: 'openai' },
  { id: 'copilot', label: 'GitHub Copilot CLI', cmd: 'copilot' },
];

function isOnPath(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    // cmd comes from the fixed registry; validate defensively before shelling out.
    if (!/^[a-z0-9-]+$/.test(cmd)) return resolve(false);
    const onWindows = process.platform === 'win32';
    const file = onWindows ? 'where' : '/bin/sh';
    const args = onWindows ? [cmd] : ['-c', `command -v ${cmd}`];
    execFile(file, args, { timeout: 2500 }, (error) => resolve(!error));
  });
}

/** Probe PATH for known AI/coding CLIs; returns the ones present, in registry order. */
export async function detectClis(): Promise<DetectedCli[]> {
  const present = await Promise.all(
    CLI_REGISTRY.map(async (cli) =>
      (await isOnPath(cli.cmd)) ? { id: cli.id, label: cli.label } : null,
    ),
  );
  return present.filter((cli): cli is DetectedCli => cli !== null);
}
