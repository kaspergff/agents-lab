import { Mastra } from "@mastra/core";
import { Observability } from "@mastra/observability";

let _mastraInstance: Mastra | null = null;
let initialized = false;

/**
 * Call once at app startup. Sets up OTel tracing.
 * Langfuse export is optional — if LANGFUSE_PUBLIC_KEY is absent the app
 * runs without it (Mastra Studio via `mastra dev` captures traces locally).
 */
export async function initObservability(): Promise<Mastra> {
  if (initialized && _mastraInstance) return _mastraInstance;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exporters: any[] = [];

  if (process.env.LANGFUSE_PUBLIC_KEY) {
    const { LangfuseExporter } = await import("@mastra/langfuse");
    exporters.push(new LangfuseExporter());
  }

  // Observability requires at least one exporter — skip when none are configured
  const observability =
    exporters.length > 0
      ? new Observability({
          configs: {
            default: {
              serviceName: "ai-agents",
              exporters,
            },
          },
        })
      : undefined;

  _mastraInstance = new Mastra(observability ? { observability } : {});
  initialized = true;
  return _mastraInstance;
}

export function getMastra(): Mastra {
  if (!_mastraInstance) {
    _mastraInstance = new Mastra();
  }
  return _mastraInstance;
}
