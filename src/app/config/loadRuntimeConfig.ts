import { defaultRuntimeConfig, RuntimeConfig } from "./runtimeConfig";

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await fetch("/app-config.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      window.__APP_CONFIG__ = defaultRuntimeConfig;
      return;
    }

    const config = (await response.json()) as Partial<RuntimeConfig>;
    window.__APP_CONFIG__ = {
      ...defaultRuntimeConfig,
      ...config,
    };
  } catch {
    window.__APP_CONFIG__ = defaultRuntimeConfig;
  }
}
