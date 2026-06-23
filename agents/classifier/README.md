# Email Urgency Classifier

Classifies emails into `high`, `normal`, or `low` priority using a Claude model with structured output.

## Input / Output

**Input** (`ClassifierInput`):

| Field     | Type   | Required | Description        |
|-----------|--------|----------|--------------------|
| `subject` | string | yes      | Email subject line |
| `body`    | string | yes      | Email body text    |
| `from`    | string | no       | Sender address     |

**Output** (`ClassifierOutput`):

| Field        | Type                         | Description                          |
|--------------|------------------------------|--------------------------------------|
| `priority`   | `"high" \| "normal" \| "low"` | Assigned urgency level               |
| `confidence` | number (0–1)                 | Model certainty estimate             |
| `reason`     | string                       | One-sentence explanation             |

Priority definitions:
- **high** — outages, security issues, hard deadlines today/tomorrow, escalations, payment or legal problems
- **normal** — standard requests, questions, scheduling, follow-ups with no immediate deadline
- **low** — newsletters, automated notifications, FYI/no-action-needed, marketing

## Usage

### CLI

Run from the monorepo root:

```bash
pnpm cls -- --subject "Production is down" --body "Customers cannot log in"
# → { "priority": "high", "confidence": 0.99, "reason": "..." }
```

Options:
- `--subject` (required)
- `--body` (required)
- `--from` (optional)
- `--model` (optional) — `haiku` (default) or `sonnet`

### As a module

```ts
import { classifier } from "@ai-agents/classifier";

const result = await classifier.run({
  subject: "Invoice overdue",
  body: "Payment was due 3 days ago. Please settle today to avoid service interruption.",
  from: "billing@vendor.com",
});

console.log(result.priority);    // "high"
console.log(result.confidence);  // e.g. 0.95
console.log(result.reason);      // "Overdue payment with an explicit service interruption threat."
```

Pass `runWithMeta` instead of `run` to also get token usage:

```ts
const { output, meta } = await classifier.runWithMeta({ subject, body });
console.log(meta.usage); // { inputTokens: 120, outputTokens: 42 }
```

## Evals

The eval dataset lives at `evals/dataset.jsonl` — 15 labelled emails covering all three priority levels.

```bash
# Haiku (default)
pnpm eval:cls

# Sonnet — compare accuracy and token cost
pnpm eval:cls -- --model sonnet
```

Output shows accuracy %, per-row pass/fail with confidence, and total token counts.

## Model

Defaults to `claude-haiku` for low cost and fast latency. Override with `--model sonnet` for higher accuracy. The model is resolved via `resolveModel()` from `@ai-agents/shared`.
