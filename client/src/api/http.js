import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  withCredentials: true,
});

// Development-only request/response interceptor for debugging logout
// Remove or disable in production
if (process.env.NODE_ENV === 'development') {
  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      // Only log logout requests to avoid noise
      if (config.url?.includes('/logout')) {
        console.log('🌐 [AXIOS REQUEST] ============================================');
        console.log('🌐 [AXIOS REQUEST] Method:', config.method?.toUpperCase());
        console.log('🌐 [AXIOS REQUEST] URL:', config.url);
        console.log('🌐 [AXIOS REQUEST] Full URL:', `${config.baseURL}${config.url}`);
        console.log('🌐 [AXIOS REQUEST] withCredentials:', config.withCredentials);
        console.log('🌐 [AXIOS REQUEST] Headers:', config.headers);
        console.log('🌐 [AXIOS REQUEST] Cookies:', document.cookie || 'NO COOKIES');
        console.log('🌐 [AXIOS REQUEST] ============================================');
      }
      return config;
    },
    (error) => {
      if (error.config?.url?.includes('/logout')) {
        console.error('❌ [AXIOS REQUEST ERROR] Request config error:', error);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      // Only log logout responses
      if (response.config?.url?.includes('/logout')) {
        console.log('🌐 [AXIOS RESPONSE] ============================================');
        console.log('🌐 [AXIOS RESPONSE] Status:', response.status);
        console.log('🌐 [AXIOS RESPONSE] URL:', response.config.url);
        console.log('🌐 [AXIOS RESPONSE] Data:', response.data);
        console.log('🌐 [AXIOS RESPONSE] Headers:', response.headers);
        console.log('🌐 [AXIOS RESPONSE] Set-Cookie header:', response.headers['set-cookie'] || 'NOT PRESENT');
        console.log('🌐 [AXIOS RESPONSE] ============================================');
      }
      return response;
    },
    (error) => {
      // Log all logout-related errors
      if (error.config?.url?.includes('/logout')) {
        console.error('❌ [AXIOS RESPONSE ERROR] ============================================');
        console.error('❌ [AXIOS RESPONSE ERROR] Error occurred');
        console.error('❌ [AXIOS RESPONSE ERROR] URL:', error.config?.url);
        console.error('❌ [AXIOS RESPONSE ERROR] Has response:', !!error.response);
        console.error('❌ [AXIOS RESPONSE ERROR] Has request:', !!error.request);
        console.error('❌ [AXIOS RESPONSE ERROR] Message:', error.message);
        
        if (error.response) {
          // Server responded with error status
          console.error('❌ [AXIOS RESPONSE ERROR] Response status:', error.response.status);
          console.error('❌ [AXIOS RESPONSE ERROR] Response data:', error.response.data);
          console.error('❌ [AXIOS RESPONSE ERROR] Response headers:', error.response.headers);
        } else if (error.request) {
          // Request made but no response (network/CORS)
          console.error('❌ [AXIOS RESPONSE ERROR] Request made but no response received');
          console.error('❌ [AXIOS RESPONSE ERROR] Request:', error.request);
          console.error('❌ [AXIOS RESPONSE ERROR] Likely CORS or network issue');
        } else {
          // Request setup error
          console.error('❌ [AXIOS RESPONSE ERROR] Request setup error:', error.message);
        }
        console.error('❌ [AXIOS RESPONSE ERROR] ============================================');
      }
      return Promise.reject(error);
    }
  );
}

export default api;

