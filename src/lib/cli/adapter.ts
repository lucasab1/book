import { spawn, SpawnOptions } from "child_process";
import { CLIProvider, GenerationResult, GenerationTask } from "./types";

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 3;

// Spawn a CLI process and collect its stdout
function spawnProcess(
  command: string,
  args: string[],
  stdin: string,
  opts?: { timeout?: number; streamCallback?: (chunk: string) => void }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const spawnOpts: SpawnOptions = { shell: false };
    console.log(`[DEBUG] Spawning: ${command} ${args.join(" ")}`);
    const proc = spawn(command, args, spawnOpts);

    let stdout = "";
    let stderr = "";
    let settled = false;
    const startTime = Date.now();

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill("SIGTERM");
        console.error(`[DEBUG] Timeout after ${Date.now() - startTime}ms`);
        reject(new Error(`Process timed out after ${opts?.timeout ?? DEFAULT_TIMEOUT_MS}ms`));
      }
    }, opts?.timeout ?? DEFAULT_TIMEOUT_MS);

    proc.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      console.log(`[DEBUG] stdout chunk: ${text.length} chars`);
      opts?.streamCallback?.(text);
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      console.error(`[DEBUG] stderr chunk: ${text}`);
    });

    proc.on("close", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        console.log(`[DEBUG] Process closed with code ${code} in ${Date.now() - startTime}ms`);
        resolve({ stdout, stderr, exitCode: code ?? 0 });
      }
    });

    // Write prompt to stdin and close
    if (proc.stdin) {
      proc.stdin.write(stdin, "utf-8");
      proc.stdin.end();
    }
  });
}

// Build the stdin payload for a given provider type
function buildStdin(provider: CLIProvider, task: GenerationTask): string {
  const parts: string[] = [];
  if (task.systemPrompt) {
    if (provider.promptFormat === "raw") {
      parts.push(`<system>\n${task.systemPrompt}\n</system>\n\n`);
    }
  }
  parts.push(task.prompt);
  return parts.join("");
}

// Extract clean text from provider output
function extractContent(provider: CLIProvider, raw: string): string {
  const text = raw.trim();
  // Strip ANSI escape codes
  return text.replace(/\x1b\[[0-9;]*m/g, "").trim();
}

// Run a single generation task with retries
export async function runTask(
  provider: CLIProvider,
  task: GenerationTask,
  streamCallback?: (chunk: string) => void
): Promise<GenerationResult> {
  const start = Date.now();
  let lastError = "";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const stdin = buildStdin(provider, task);
      const { stdout, exitCode } = await spawnProcess(
        provider.command,
        [...provider.args],
        stdin,
        { timeout: DEFAULT_TIMEOUT_MS, streamCallback }
      );

      if (exitCode !== 0 && !stdout.trim()) {
        lastError = `Exit code ${exitCode}`;
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return {
        taskId: task.id,
        providerId: provider.id,
        content: extractContent(provider, stdout),
        durationMs: Date.now() - start,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  return {
    taskId: task.id,
    providerId: provider.id,
    content: "",
    durationMs: Date.now() - start,
    error: lastError,
  };
}

// Run a task and stream results via a Server-Sent Events compatible callback
export async function* streamTask(
  provider: CLIProvider,
  task: GenerationTask
): AsyncGenerator<string, void, unknown> {
  const buffer: string[] = [];
  let done = false;
  let error: string | undefined;

  const chunks: string[] = [];
  const runPromise = runTask(provider, task, (chunk) => chunks.push(chunk));

  // Simple streaming simulation: collect and yield as they arrive
  const result = await runPromise;
  if (result.error) { error = result.error; }

  if (error) throw new Error(error);

  // Yield in small chunks for streaming effect
  const words = result.content.split(" ");
  for (let i = 0; i < words.length; i += 5) {
    yield words.slice(i, i + 5).join(" ") + " ";
  }

  void buffer; void done;
}

// Check if a CLI provider is available on the system
export async function checkProvider(provider: CLIProvider): Promise<boolean> {
  try {
    const { exitCode } = await spawnProcess(
      provider.command,
      ["--version"],
      "",
      { timeout: 5000 }
    );
    return exitCode === 0;
  } catch {
    return false;
  }
}
