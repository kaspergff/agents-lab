import type { AgentRunner, RunMeta, RunOptions } from "@ai-agents/core";
import { resolveModel, DEFAULT_MODEL } from "@ai-agents/shared";
import { buildClassifierAgent } from "./agent.js";
import {
  ClassifierInputSchema,
  ClassifierOutputSchema,
  type ClassifierInput,
  type ClassifierOutput,
} from "./schema.js";

function formatPrompt(input: ClassifierInput): string {
  const from = input.from ? `From: ${input.from}\n` : "";
  return `${from}Subject: ${input.subject}\n\n${input.body}`;
}

function isUsage(u: unknown): u is { inputTokens: number; outputTokens?: number } {
  return (
    typeof u === "object" &&
    u !== null &&
    "inputTokens" in u &&
    typeof (u as Record<string, unknown>).inputTokens === "number"
  );
}

export const classifier: AgentRunner<ClassifierInput, ClassifierOutput> = {
  id: "classifier",
  name: "Email Urgency Classifier",
  defaultModel: DEFAULT_MODEL,
  inputSchema: ClassifierInputSchema,
  outputSchema: ClassifierOutputSchema,

  async run(input: ClassifierInput, opts?: RunOptions): Promise<ClassifierOutput> {
    const { output } = await this.runWithMeta!(input, opts);
    return output;
  },

  async runWithMeta(
    input: ClassifierInput,
    opts?: RunOptions,
  ): Promise<{ output: ClassifierOutput; meta: RunMeta }> {
    const model = resolveModel(opts?.model ?? this.defaultModel);
    const agent = buildClassifierAgent(model);
    const prompt = formatPrompt(input);
    const response = await agent.generate(prompt, {
      structuredOutput: { schema: ClassifierOutputSchema },
    });
    const output = ClassifierOutputSchema.parse(response.object);
    const rawUsage = response.usage;
    return {
      output,
      meta: {
        usage: isUsage(rawUsage)
          ? { inputTokens: rawUsage.inputTokens, outputTokens: rawUsage.outputTokens ?? 0 }
          : undefined,
      },
    };
  },
};
