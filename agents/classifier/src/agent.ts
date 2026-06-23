import { Agent } from "@mastra/core/agent";
import { ClassifierOutputSchema } from "./schema.js";

const SYSTEM_PROMPT = `You are an email urgency classifier. Classify emails into exactly one priority level:

- high: time-sensitive and consequential — outages, security issues, hard deadlines today/tomorrow, escalations, payment or legal problems, anything explicitly urgent.
- normal: standard requests, questions, scheduling, follow-ups with no immediate deadline.
- low: newsletters, automated notifications, FYI/no-action-needed, marketing, social updates.

Respond with a JSON object containing:
- priority: "high" | "normal" | "low"
- confidence: a number 0–1 estimating your certainty
- reason: one sentence explaining the classification`;

export function buildClassifierAgent(model: string): Agent {
  return new Agent({
    id: "email-classifier",
    name: "email-classifier",
    instructions: SYSTEM_PROMPT,
    model,
  });
}

export { ClassifierOutputSchema };
