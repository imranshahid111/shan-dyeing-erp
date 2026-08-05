export interface RuntimeConfig {
  apiBaseUrl: string;
  localIp?: string | null;
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<RuntimeConfig>;
  }
}

// Get client local IP using WebRTC
export async function getLocalIp(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => resolve(null));

      pc.onicecandidate = (event) => {
        if (!event?.candidate?.candidate) return;

        const candidate = event.candidate.candidate;
        const match = candidate.match(
          /([0-9]{1,3}(\.[0-9]{1,3}){3})/
        );

        if (match) {
          resolve(match[1]);
          pc.close();
        }
      };

      setTimeout(() => {
        resolve(null);
        pc.close();
      }, 2000);
    } catch {
      resolve(null);
    }
  });
}

export function formatApiUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return '';

  // If it already has http:// or https://, use as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it's a hostname or IP with a port, e.g. 192.168.1.10:3000
  if (trimmed.includes(':')) {
    return `http://${trimmed}/api`;
  }

  // Otherwise, default port is 5001 and path is /api
  return `http://${trimmed}:5001/api`;
}

export function setCustomServerIp(rawInput: string): void {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    localStorage.removeItem('custom_server_ip_raw');
    localStorage.removeItem('custom_api_base_url');
    return;
  }
  
  const computedUrl = formatApiUrl(trimmed);
  localStorage.setItem('custom_server_ip_raw', trimmed);
  localStorage.setItem('custom_api_base_url', computedUrl);
}

export function getCustomServerIpRaw(): string {
  return localStorage.getItem('custom_server_ip_raw') || '';
}

export function getCustomApiBaseUrl(): string {
  return localStorage.getItem('custom_api_base_url') || '';
}

export const defaultRuntimeConfig: RuntimeConfig = {
  apiBaseUrl: 'http://127.0.0.1:5001/api',
};

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  const customUrl = localStorage.getItem('custom_api_base_url')?.trim();
  const runtimeValue = window.__APP_CONFIG__?.apiBaseUrl?.trim();
  const envValue = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  // 1. Detect local IP via WebRTC
  console.log('Attempting to detect local IP via WebRTC...');
  const localIp = await getLocalIp();
  console.log('Detected local IP:', localIp);

  // 1.5. Highest Priority: Manual user-inputted IP saved in localStorage
  if (customUrl) {
    console.log('Using Custom LocalStorage Base URL (User Settings):', customUrl);
    return {
      apiBaseUrl: customUrl,
      localIp: localIp
    };
  }

  // 2. Second Priority: Manual override in window.__APP_CONFIG__ (from app-config.json)
  if (runtimeValue) {
    console.log('Using Runtime Config Base URL (Manual Override):', runtimeValue);
    return { 
      apiBaseUrl: runtimeValue,
      localIp: localIp
    };
  }

  // 3. Third Priority: Use detected local IP if available
  if (localIp) {
    const autoUrl = `http://${localIp}:5001/api`;
    console.log('Using Auto-Detected Base URL:', autoUrl);
    return {
      apiBaseUrl: autoUrl,
      localIp: localIp,
    };
  }

  // 4. Fourth Priority: Environment variable (VITE_API_BASE_URL)
  if (envValue) {
    console.log('Using Environment Variable Base URL:', envValue);
    return { 
      apiBaseUrl: envValue,
      localIp: localIp
    };
  }

  // 5. Fallback: Default hardcoded URL
  console.log('Using Default Fallback Base URL:', defaultRuntimeConfig.apiBaseUrl);
  return {
    apiBaseUrl: defaultRuntimeConfig.apiBaseUrl,
    localIp: localIp,
  };
}