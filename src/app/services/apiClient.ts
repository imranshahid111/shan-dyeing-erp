import axios from 'axios';
import { getRuntimeConfig } from '../config/runtimeConfig';
import { serverStatusStore } from './serverStatusStore';

const { apiBaseUrl } = getRuntimeConfig();
const API_BASE_URL = apiBaseUrl;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 600;

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetry(error: any) {
  const status = error?.response?.status;
  return !status || status >= 500;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const mutableConfig = config as any;
  if (typeof mutableConfig.__retryCount !== 'number') {
    mutableConfig.__retryCount = 0;
  }
  // #region agent log
  fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'initial-diagnosis',hypothesisId:'H1',location:'src/app/services/apiClient.ts:request',message:'Dispatching API request',data:{baseURL:config.baseURL,url:config.url,method:config.method},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'iteration-3',hypothesisId:'H9',location:'src/app/services/apiClient.ts:request:env',message:'Client connectivity context',data:{online:navigator.onLine,baseURL:config.baseURL},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    serverStatusStore.markConnected();
    // #region agent log
    fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'initial-diagnosis',hypothesisId:'H3',location:'src/app/services/apiClient.ts:response',message:'Received API response',data:{status:response.status,url:response.config?.url},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return response.data;
  },
  async (error) => {
    const requestConfig = (error.config || {}) as any;
    const currentRetryCount = Number(requestConfig.__retryCount || 0);

    if (shouldRetry(error) && currentRetryCount < MAX_RETRIES) {
      requestConfig.__retryCount = currentRetryCount + 1;
      // #region agent log
      fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'iteration-2',hypothesisId:'H6',location:'src/app/services/apiClient.ts:retry',message:'Retrying API request',data:{url:requestConfig.url,retryCount:requestConfig.__retryCount,code:error.code,status:error.response?.status},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      await wait(RETRY_DELAY_MS * requestConfig.__retryCount);
      return apiClient(requestConfig);
    }

    const errorMessage = error.response?.data?.message || error.message || 'Server not available';
    if (error.code === 'ERR_NETWORK' || !error.response || error.response?.status >= 500) {
      serverStatusStore.markDisconnected(errorMessage);
      // #region agent log
      fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'iteration-2',hypothesisId:'H7',location:'src/app/services/apiClient.ts:disconnect-state',message:'Marked server disconnected',data:{url:requestConfig.url,code:error.code,status:error.response?.status,errorMessage},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }

    console.error('API Error:', error.response?.data || error.message);
    // #region agent log
    fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'initial-diagnosis',hypothesisId:'H2',location:'src/app/services/apiClient.ts:error',message:'API request failed',data:{url:error.config?.url,baseURL:error.config?.baseURL,code:error.code,status:error.response?.status,message:error.message},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return Promise.reject(error);
  }
);

export default apiClient;
