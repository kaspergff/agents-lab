import { Mastra } from "@mastra/core";
import { Observability } from "@mastra/observability";

let _initPromise: Promise<Mastra> | null = null;
// Synchronous reference populated once the promise resolves, so getMastra()
// can stay synchronous after initObservability() has been awaited.
let _resolvedInstance: Mastra | null = null;

/**
 * Call once at app startup. Sets up OTel tracing.
 * Langfuse export is optional — if LANGFUSE_PUBLIC_KEY is absent the app
 * runs without it (Mastra Studio via `mastra dev` captures traces locally).
 */
export function initObservability(): Promise<Mastra> {
  if (!_initPromise) {
    _initPromise = doInit().then((m) => {
      _resolvedInstance = m;
      return m;
    });
  }
  return _initPromise;
}

async function doInit(): Promise<Mastra> {
  type LangfuseExporterInstance = InstanceType<
    (typeof import("@mastra/langfuse"))["LangfuseExporter"]
  >;
  const exporters: LangfuseExporterInstance[] = [];

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

  return new Mastra(observability ? { observability } : {});
}

export function getMastra(): Mastra {
  if (!_resolvedInstance) {
    _resolvedInstance = new Mastra();
  }
  return _resolvedInstance;
}
