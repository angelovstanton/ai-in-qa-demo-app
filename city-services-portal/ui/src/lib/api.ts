import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = error.response?.data?.error?.message;
      
      console.warn('Authentication error:', error.response?.status, errorCode, errorMessage);
      
      // Only handle token-related 401 errors, not login failures
      const isTokenError = errorCode === 'TOKEN_EXPIRED' || 
                          errorCode === 'INVALID_TOKEN' || 
                          errorCode === 'UNAUTHORIZED';
      
      // Don't redirect for login attempts or auth checks
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register') ||
                           error.config?.url?.includes('/auth/me');
      
      if (isTokenError && !isAuthEndpoint) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('new-request-form-data');
        
        // Only show session expired for actual token expiration
        if (errorCode === 'TOKEN_EXPIRED') {
          alert('Your session has expired. Please log in again.');
        } else {
          alert('Authentication failed. Please log in again.');
        }
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // 403 is for permission issues, not session expiration
      const errorMessage = error.response?.data?.error?.message;
      console.warn('Permission error:', errorMessage);
      
      // Don't automatically redirect for 403 errors
      // These are typically role-based access issues
    }
    return Promise.reject(error);
  }
);

export default api;