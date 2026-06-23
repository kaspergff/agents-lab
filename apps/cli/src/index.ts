import { initObservability } from "@ai-agents/observability";
import { classifier } from "@ai-agents/classifier";
import { runEval, printEvalReport } from "@ai-agents/evals";
import type { AgentRunner } from "@ai-agents/core";
import { resolve } from "path";
import { fileURLToPath } from "url";

const AGENTS: Record<string, AgentRunner<Record<string, unknown>, Record<string, unknown>>> = {
  classifier: classifier as AgentRunner<Record<string, unknown>, Record<string, unknown>>,
};

const EVAL_DATASETS: Record<string, string> = {
  classifier: resolve(
    fileURLToPath(import.meta.url),
    "../../../../agents/classifier/evals/dataset.jsonl",
  ),
};

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      result[key] = value;
    }
  }
  return result;
}

async function main() {
  await initObservability();

  const [, , subcommand, agentId, ...rest] = process.argv;
  const flags = parseArgs(rest);

  if (!subcommand || !agentId) {
    console.error("Usage: cli run <agent> [--subject ...] [--body ...] [--from ...] [--model ...]");
    console.error("       cli eval <agent> [--model ...]");
    process.exit(1);
  }

  const agent = AGENTS[agentId];
  if (!agent) {
    console.error(`Unknown agent: ${agentId}. Available: ${Object.keys(AGENTS).join(", ")}`);
    process.exit(1);
  }

  if (subcommand === "run") {
    if (agentId === "classifier") {
      if (!flags.subject || !flags.body) {
        console.error("classifier requires --subject and --body");
        process.exit(1);
      }
      const { classifier: cls } = await import("@ai-agents/classifier");
      const result = await cls.run(
        { subject: flags.subject, body: flags.body, from: flags.from },
        flags.model ? { model: flags.model } : undefined,
      );
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error(`run not implemented for agent: ${agentId}`);
      process.exit(1);
    }
  } else if (subcommand === "eval") {
    const datasetPath = EVAL_DATASETS[agentId];
    if (!datasetPath) {
      console.error(`No eval dataset found for agent: ${agentId}`);
      process.exit(1);
    }
    const { classifier: cls } = await import("@ai-agents/classifier");
    const summary = await runEval(cls, datasetPath, flags.model);
    printEvalReport(summary);
  } else {
    console.error(`Unknown subcommand: ${subcommand}. Use "run" or "eval".`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
