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

export const classifier: AgentRunner<ClassifierInput, ClassifierOutput> = {
  id: "classifier",
  name: "Email Urgency Classifier",
  defaultModel: DEFAULT_MODEL,
  inputSchema: ClassifierInputSchema,
  outputSchema: ClassifierOutputSchema,

  async run(input: ClassifierInput, opts?: RunOptions): Promise<ClassifierOutput> {
    const model = resolveModel(opts?.model ?? this.defaultModel);
    const agent = buildClassifierAgent(model);
    const prompt = formatPrompt(input);
    const response = await agent.generate(prompt, {
      structuredOutput: { schema: ClassifierOutputSchema },
    });
    return response.object as ClassifierOutput;
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
    const output = response.object as ClassifierOutput;
    const usage = response.usage as
      | { inputTokens?: number; outputTokens?: number }
      | undefined;
    return {
      output,
      meta: {
        usage:
          usage?.inputTokens !== undefined
            ? {
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens ?? 0,
              }
            : undefined,
      },
    };
  },
};
