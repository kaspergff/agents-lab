/** Verified model strings from Anthropic docs (June 2026) */
const MODEL_ALIASES: Record<string, string> = {
  haiku: "anthropic/claude-haiku-4-5-20251001",
  sonnet: "anthropic/claude-sonnet-4-6",
};

/** Default model used when nothing else is specified */
export const DEFAULT_MODEL = MODEL_ALIASES.haiku;

/**
 * Resolves a model alias ("haiku", "sonnet") or a full model string to a
 * concrete model string. Falls back to DEFAULT_MODEL when given nothing.
 */
export function resolveModel(alias?: string): string {
  if (!alias) return DEFAULT_MODEL;
  return MODEL_ALIASES[alias] ?? alias;
}
