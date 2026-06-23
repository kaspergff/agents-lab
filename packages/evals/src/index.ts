import { readFileSync } from "fs";
import { resolve } from "path";
import type { AgentRunner } from "@ai-agents/core";

export interface EvalRow {
  subject: string;
  body: string;
  from?: string;
  expected: string;
}

export interface EvalResult {
  row: EvalRow;
  predicted: string;
  confidence: number;
  pass: boolean;
  inputTokens: number;
  outputTokens: number;
}

export interface EvalSummary {
  model: string;
  total: number;
  passed: number;
  accuracy: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  results: EvalResult[];
}

export function loadDataset(path: string): EvalRow[] {
  const content = readFileSync(resolve(path), "utf-8");
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as EvalRow);
}

export async function runEval<TInput extends { subject: string; body: string; from?: string }>(
  agent: AgentRunner<TInput, { priority: string; confidence: number; reason: string }>,
  datasetPath: string,
  modelOverride?: string,
): Promise<EvalSummary> {
  const rows = loadDataset(datasetPath);
  const model = modelOverride ?? agent.defaultModel;
  const results: EvalResult[] = [];

  for (const row of rows) {
    const input = { subject: row.subject, body: row.body, from: row.from } as TInput;
    const opts = modelOverride ? { model: modelOverride } : undefined;

    let predicted = "";
    let confidence = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    if (agent.runWithMeta) {
      const { output, meta } = await agent.runWithMeta(input, opts);
      predicted = output.priority;
      confidence = output.confidence;
      inputTokens = meta.usage?.inputTokens ?? 0;
      outputTokens = meta.usage?.outputTokens ?? 0;
    } else {
      console.warn(`[evals] Agent "${agent.id}" has no runWithMeta — token counts will be 0`);
      const output = await agent.run(input, opts);
      predicted = output.priority;
      confidence = output.confidence;
    }

    results.push({
      row,
      predicted,
      confidence,
      pass: predicted === row.expected,
      inputTokens,
      outputTokens,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const totalIn = results.reduce((s, r) => s + r.inputTokens, 0);
  const totalOut = results.reduce((s, r) => s + r.outputTokens, 0);

  return {
    model,
    total: results.length,
    passed,
    accuracy: results.length ? passed / results.length : 0,
    totalInputTokens: totalIn,
    totalOutputTokens: totalOut,
    avgInputTokens: results.length ? Math.round(totalIn / results.length) : 0,
    avgOutputTokens: results.length ? Math.round(totalOut / results.length) : 0,
    results,
  };
}

export function printEvalReport(summary: EvalSummary): void {
  console.log(`\nModel : ${summary.model}`);
  console.log(
    `Score : ${summary.passed}/${summary.total} = ${(summary.accuracy * 100).toFixed(1)}% accuracy`,
  );
  console.log(
    `Tokens: ${summary.totalInputTokens} in / ${summary.totalOutputTokens} out`,
    `(avg ${summary.avgInputTokens}/${summary.avgOutputTokens} per row)`,
  );

  const passConfidence = summary.results.filter((r) => r.pass).map((r) => r.confidence);
  const failConfidence = summary.results.filter((r) => !r.pass).map((r) => r.confidence);
  if (passConfidence.length)
    console.log(
      `Confidence — pass avg: ${(passConfidence.reduce((a, b) => a + b, 0) / passConfidence.length).toFixed(2)}`,
    );
  if (failConfidence.length)
    console.log(
      `Confidence — fail avg: ${(failConfidence.reduce((a, b) => a + b, 0) / failConfidence.length).toFixed(2)}`,
    );

  console.log();
  const pad = (s: string, n: number) => s.padEnd(n);
  console.log(
    pad("#", 3),
    pad("Expected", 8),
    pad("Predicted", 10),
    pad("Conf", 6),
    pad("Tokens(in/out)", 16),
    "Result",
    "| Subject",
  );
  console.log("─".repeat(80));
  summary.results.forEach((r, i) => {
    console.log(
      pad(String(i + 1), 3),
      pad(r.row.expected, 8),
      pad(r.predicted, 10),
      pad(r.confidence.toFixed(2), 6),
      pad(`${r.inputTokens}/${r.outputTokens}`, 16),
      r.pass ? "PASS" : "FAIL",
      "|",
      r.row.subject.slice(0, 40),
    );
  });
  console.log();
}
