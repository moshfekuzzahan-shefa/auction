import axios from 'axios';
import { store } from '../store/store';
import { logout, setCredentials } from '../store/authSlice';

// Create a generic axios instance
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // required for httpOnly cookies
});

// Cache for the CSRF token promise to prevent concurrent fetches
let csrfTokenPromise: Promise<string> | null = null;

async function getCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = axios.get('/api/csrf-token', { withCredentials: true })
      .then(res => res.data.csrfToken)
      .catch(err => {
        csrfTokenPromise = null;
        throw err;
      });
  }
  return csrfTokenPromise;
}

// Request Interceptor to append CSRF token
api.interceptors.request.use(async (config) => {
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    try {
      const token = await getCsrfToken();
      config.headers['CSRF-Token'] = token;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor for handling expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token using httpOnly cookies automatically sent
        const res = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        
        if (res.data.data.accessToken) {
          // Update Redux state with new access token if needed (handled in slice)
          store.dispatch(setCredentials({ token: res.data.data.accessToken }));
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log the user out entirely
        store.dispatch(logout());
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
