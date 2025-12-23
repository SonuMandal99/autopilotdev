import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.error('Unauthorized - Redirecting to login');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden - Insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 429:
          console.error('Too many requests - Rate limited');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error(`Error ${status}: ${data?.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server - Network error');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error.response?.data || { 
      message: error.message || 'Network error occurred' 
    });
  }
);

// API helper functions
export const apiHelper = {
  // Health check
  async healthCheck() {
    return api.get('/health');
  },

  // Generic GET request
  async get(endpoint, params = {}) {
    return api.get(endpoint, { params });
  },

  // Generic POST request
  async post(endpoint, data = {}) {
    return api.post(endpoint, data);
  },

  // Generic PUT request
  async put(endpoint, data = {}) {
    return api.put(endpoint, data);
  },

  // Generic PATCH request
  async patch(endpoint, data = {}) {
    return api.patch(endpoint, data);
  },

  // Generic DELETE request
  async delete(endpoint) {
    return api.delete(endpoint);
  },

  // File upload
  async uploadFile(endpoint, file, onUploadProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  // Download file
  async downloadFile(endpoint) {
    return api.get(endpoint, {
      responseType: 'blob',
    });
  },

  // Set auth token
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  // Clear auth token
  clearAuthToken() {
    this.setAuthToken(null);
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Get current user info
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Set current user info
  setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Clear current user info
  clearCurrentUser() {
    localStorage.removeItem('user');
  },

  // Logout user
  logout() {
    this.clearAuthToken();
    this.clearCurrentUser();
    window.location.href = '/login';
  },
};

// Export axios instance as default
export default api;