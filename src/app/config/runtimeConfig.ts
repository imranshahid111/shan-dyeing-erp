export interface RuntimeConfig {
  apiBaseUrl: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<RuntimeConfig>;
  }
  // Injected by Vite at build/dev time from the host machine's LAN IP
  const __LAN_IP__: string;
}

// LAN IP is auto-detected at build/dev time by vite.config.ts
const detectedLanIp: string =
  typeof __LAN_IP__ !== 'undefined' ? __LAN_IP__ : '127.0.0.1';

export const defaultRuntimeConfig: RuntimeConfig = {
  apiBaseUrl: `http://${detectedLanIp}:5001/api`,
};

export function getRuntimeConfig(): RuntimeConfig {
  const runtimeValue = window.__APP_CONFIG__?.apiBaseUrl?.trim();
  const envValue = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  return {
    apiBaseUrl: runtimeValue || envValue || defaultRuntimeConfig.apiBaseUrl,
  };
}
