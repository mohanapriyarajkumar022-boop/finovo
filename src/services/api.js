// frontend/src/services/api.js
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
});

// Request interceptor to add auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token');
    let tenantId = localStorage.getItem('tenantId');

    // Ensure tenantId exists
    if (!tenantId) {
      tenantId = 'dev-tenant-default';
      localStorage.setItem('tenantId', tenantId);
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Always add tenantId to headers
    config.headers['Tenant-ID'] = tenantId;
    config.headers['tenant-id'] = tenantId;

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      tenantId,
      hasToken: !!token
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.response?.data?.error
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;