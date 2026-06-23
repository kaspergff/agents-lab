# AI Agents Monorepo

A framework-agnostic monorepo for AI agents. Today: Mastra + Claude. Tomorrow: anything.

## Structure

```
packages/core          — AgentRunner interface (the shared contract)
packages/shared        — model aliases, resolveModel()
packages/observability — optional Langfuse/OTel init
packages/evals         — dataset loader + eval runner
agents/classifier      — email urgency classifier (Haiku by default)
apps/cli               — run and eval agents locally
```

## Setup

```bash
pnpm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY in .env
```

> ⚠️ **Do NOT run `pnpm audit fix --force`** — it downgrades Mastra to a
> breaking version. The Rollup vulnerability flagged after install is a known
> false-alarm in Mastra's deployer package and has no impact on local dev.

## Run the classifier

```bash
pnpm cls -- --subject "Production is down" --body "Customers cannot log in"
# → { "priority": "high", "confidence": 0.99, "reason": "..." }
```

Options:
- `--subject` (required) — email subject line
- `--body` (required) — email body text
- `--from` (optional) — sender address
- `--model` (optional) — `haiku` (default) or `sonnet`

## Run evals

```bash
# Haiku (default)
pnpm eval:cls

# Sonnet — compare accuracy and token cost
pnpm eval:cls -- --model sonnet
```

Output includes model used, accuracy %, per-row pass/fail with confidence, and total/average token counts.

## Where to see traces

**Local (no account needed):** start Mastra Studio:

```bash
npx mastra dev
# open http://localhost:4111
```

Per-run traces, token usage, and step timings appear automatically.

**External (optional):** configure Langfuse in `.env`:

```env
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_HOST=https://cloud.langfuse.com   # or your self-hosted URL
```

Traces will flow to Langfuse on the next run. The app runs fully without these vars set.

## Code quality

```bash
pnpm typecheck   # tsc --noEmit across the workspace
pnpm lint        # ESLint
pnpm format      # Prettier
```

## Adding a new agent

1. Create `agents/<name>/` with `src/schema.ts`, `src/agent.ts`, `src/index.ts`
2. `src/index.ts` exports an object implementing `AgentRunner` from `@ai-agents/core`
3. Register it in `apps/cli/src/index.ts` (add to `AGENTS` and `EVAL_DATASETS` maps)
4. Add an eval dataset at `agents/<name>/evals/dataset.jsonl`

No changes to existing agents required.
