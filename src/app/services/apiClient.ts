import axios, { AxiosInstance } from 'axios';
import { getRuntimeConfig } from '../config/runtimeConfig';
import { serverStatusStore } from './serverStatusStore';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 600;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error: any) {
  const status = error?.response?.status;
  return !status || status >= 500;
}

/**
 * Create API client instance with defaults.
 * This ensures that 'import apiClient' never returns undefined.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Set up interceptors on the instance
apiClient.interceptors.request.use((config: any) => {
  if (typeof config.__retryCount !== 'number') {
    config.__retryCount = 0;
  }
  
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response: any) => {
    serverStatusStore.markConnected();
    return response.data;
  },
  async (error: any) => {
    const requestConfig = error.config || {};
    const currentRetryCount = Number(requestConfig.__retryCount || 0);

    if (shouldRetry(error) && currentRetryCount < MAX_RETRIES) {
      requestConfig.__retryCount = currentRetryCount + 1;

      await wait(RETRY_DELAY_MS * requestConfig.__retryCount);
      // Use the instance to retry
      return apiClient(requestConfig);
    }

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Server not available';

    if (error.code === 'ERR_NETWORK' || !error.response || error.response?.status >= 500) {
      serverStatusStore.markDisconnected(errorMessage);
    }

    console.error('API Error:', error.response?.data || error.message);

    return Promise.reject(error);
  }
);

/**
 * Update API client configuration AFTER runtime config is ready
 */
export async function initApiClient() {
  try {
    const { apiBaseUrl } = await getRuntimeConfig();
    console.log('Initializing API Client with Base URL:', apiBaseUrl);
    apiClient.defaults.baseURL = apiBaseUrl;
    return apiClient;
  } catch (error) {
    console.error('Failed to initialize API Client:', error);
    return apiClient;
  }
}

/**
 * Getter (optional, since apiClient is now stable)
 */
export function getApiClient() {
  return apiClient;
}

export default apiClient;