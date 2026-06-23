import type { z } from "zod";

export interface RunOptions {
  /** Optional model override — e.g. "haiku", "sonnet", or a full model string.
   *  When omitted the agent uses its own defaultModel. Used for benchmarking. */
  model?: string;
}

export interface RunMeta {
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AgentRunner<TInput = unknown, TOutput = unknown> {
  /** Stable unique id, e.g. "classifier" */
  id: string;
  /** Human-readable name */
  name: string;
  /** The agent's default model string (for display/logging) */
  defaultModel: string;
  /** Zod schemas for validation + typing */
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  /** Run the agent once; opts.model overrides the default if provided */
  run(input: TInput, opts?: RunOptions): Promise<TOutput>;
  /** Like run(), but also returns token usage. Used by the eval runner. */
  runWithMeta?(input: TInput, opts?: RunOptions): Promise<{ output: TOutput; meta: RunMeta }>;
}
