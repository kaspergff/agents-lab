# AI Agents Monorepo

A framework-agnostic monorepo for AI agents. Agents are organized by capability, not by framework — the framework is an implementation detail hidden behind a shared `AgentRunner` contract.

---

## The classifier

The first agent classifies incoming emails by urgency. Single LLM call, structured output, validated by Zod.

**Input**

| Field     | Type   | Required |
|-----------|--------|----------|
| `subject` | string | yes      |
| `body`    | string | yes      |
| `from`    | string | no       |

**Output**

| Field        | Type                            | Description                      |
|--------------|---------------------------------|----------------------------------|
| `priority`   | `"high" \| "normal" \| "low"`   | Assigned urgency level           |
| `confidence` | number (0–1)                    | Model certainty estimate         |
| `reason`     | string                          | One-sentence justification       |

**Priority definitions:**
- **high** — outages, security issues, hard deadlines today/tomorrow, escalations, payment or legal problems
- **normal** — standard requests, questions, scheduling, follow-ups with no immediate deadline
- **low** — newsletters, automated notifications, FYI/no-action-needed, marketing

**Example:**

```
$ pnpm cls -- --subject "Prod API returning 500s" --body "All checkouts failing since 14:02"
{
  "priority": "high",
  "confidence": 0.97,
  "reason": "Production outage with direct revenue impact and an explicit start time."
}
```

---

## The `AgentRunner` contract

Every agent implements this interface, regardless of the underlying framework:

```ts
interface AgentRunner<TInput, TOutput> {
  id: string;
  name: string;
  defaultModel: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  run(input: TInput, opts?: RunOptions): Promise<TOutput>;
  runWithMeta?(input: TInput, opts?: RunOptions): Promise<{ output: TOutput; meta: RunMeta }>;
}
```

`RunOptions.model` is the only config knob: it lets you swap models per call without changing the agent. This is what makes Haiku-vs-Sonnet benchmarking possible from a single command.

Adding a new agent means implementing this interface in a new `agents/<name>/` folder. Nothing else changes.

---

## Architecture

```
packages/core          — AgentRunner interface + RunOptions/RunMeta types
packages/shared        — model alias map, resolveModel() helper
packages/observability — optional Langfuse/OTel init (app runs fine without it)
packages/evals         — framework-agnostic eval runner: takes any AgentRunner
agents/classifier      — email urgency classifier (Mastra + Claude Haiku by default)
apps/cli               — subcommand CLI: `run <agent>` and `eval <agent>`
```

`packages/core` has no runtime dependencies — it's pure TypeScript types. Everything else depends on it, nothing in it depends on anything else.

---

## Evals & benchmarking

The eval runner loads a labeled `.jsonl` dataset, runs the agent over every row, and prints:

```
Model:    claude-haiku-4-5
Accuracy: 13/15 (87%)

  # subject                               expected   got      conf   tokens
  ✓ 1  URGENT: prod API returning 500s    high       high     0.99   162
  ✓ 2  Lunch next week?                   low        low      0.95   148
  ✗ 3  Quick question about the docs      normal     low      0.61   151
  ...

Total tokens:  2 341 in / 631 out
Avg per run:   156 in / 42 out
```

Run the same dataset on a different model to compare accuracy and cost:

```bash
pnpm eval:cls                    # Haiku (default)
pnpm eval:cls -- --model sonnet  # Sonnet
```

---

## Observability

**Local (no account needed):** Mastra Studio shows per-run traces, token usage, and step timings automatically.

```bash
npx mastra dev   # → http://localhost:4111
```

**External (optional):** set `LANGFUSE_*` vars in `.env` to forward traces to Langfuse. The app runs fully without these.

---

## Setup

```bash
pnpm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY
```

> ⚠️ **Do NOT run `pnpm audit fix --force`** — it downgrades Mastra to a breaking version. The Rollup vulnerability flagged after install is a known false-alarm in Mastra's deployer package.

---

## Commands

```bash
# Run the classifier
pnpm cls -- --subject "<s>" --body "<b>" [--from "<addr>"] [--model haiku|sonnet]

# Evals
pnpm eval:cls [-- --model sonnet]

# Code quality
pnpm typecheck   # tsc --noEmit across the workspace
pnpm lint        # ESLint
pnpm format      # Prettier
```

---

## Adding a new agent

1. Create `agents/<name>/src/` with `schema.ts`, `agent.ts`, `index.ts`
2. `index.ts` exports an object implementing `AgentRunner` from `@ai-agents/core`
3. Register it in `apps/cli/src/index.ts` (add to `AGENTS` and `EVAL_DATASETS` maps)
4. Add a labeled dataset at `agents/<name>/evals/dataset.jsonl`

No changes to existing agents or packages required.
