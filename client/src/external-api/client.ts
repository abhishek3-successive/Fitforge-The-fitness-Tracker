import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/auth-store';

// API Configuration - Use environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/graphql';

console.log('API Configuration:', { 
  API_BASE_URL, 
  GRAPHQL_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
}); // Debug log

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout to 60 seconds for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  validateStatus: function (status) {
    return status < 500; // Don't throw for 4xx errors, only 5xx
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('Making API request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`
    });
    
    // Get token from localStorage (for SSR compatibility)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('API response error:', {
      message: error?.message || 'Unknown error',
      status: error?.response?.status,
      data: error?.response?.data,
      config: {
        method: error?.config?.method,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL
      }
    });
    
    const originalRequest = error.config;
    
    // Don't attempt token refresh for login/register endpoints or if already retrying
    const isAuthEndpoint = originalRequest.url?.includes('/users/login') || 
                          originalRequest.url?.includes('/users/register') ||
                          originalRequest.url?.includes('/users/refresh-token');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      
      try {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/users/refresh-token`, {
              refreshToken,
            });
            
            // Handle the response structure from backend
            const responseData = response.data.data || response.data;
            const newAccessToken = responseData.accessToken || responseData.token;
            
            if (newAccessToken) {
              localStorage.setItem('accessToken', newAccessToken);
              
              // Update the authorization header and retry the request
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return apiClient(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, logout user
        const { logout } = useAuthStore.getState();
        logout();
        
        // Redirect to login page only if not already on auth pages
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
          window.location.href = '/auth/login';
        }
      }
    }
    
    // For login/register failures, ensure error is properly rejected
    if (isAuthEndpoint && error.response?.status === 401) {
      console.warn('Authentication failed:', error.response.data?.message || 'Invalid credentials');
    }
    
    return Promise.reject(error);
  }
);

// GraphQL client configuration
export const graphqlClient = axios.create({
  baseURL: GRAPHQL_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to GraphQL requests
graphqlClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Success response utility
export const handleApiResponse = <T>(response: AxiosResponse): T => {
  return response.data.data || response.data;
};