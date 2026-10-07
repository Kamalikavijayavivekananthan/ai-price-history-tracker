import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ai-price-history-tracker.onrender.com/api',,
});

// Automatically inject JWT Token if available in localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AUTHENTICATION APIs
export const login = (credentials) => API.post('/auth/login', credentials);
export const register = (userData) => API.post('/auth/register', userData);
export const verifyOtp = (data) => API.post('/auth/verify-otp', data);
export const resendOtp = (email) => API.post('/auth/resend-otp', { email });
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword = (data) => API.post('/auth/reset-password', data);
export const getProfile = () => API.get('/auth/me');

// PRODUCTS APIs
export const fetchProducts = (params) => API.get('/products', { params });
export const fetchProductById = (id) => API.get(`/products/${id}`);
export const createProduct = (productData) => API.post('/products', productData);
export const deleteProduct = (id) => API.delete(`/products/${id}`);
export const fetchPricePrediction = (id) => API.get(`/products/${id}/predict`);
export const simulatePriceUpdate = (id, newPrice) => API.post(`/products/${id}/price-update`, { newPrice });
export const forceCronPriceCheck = () => API.post('/trigger-cron');

// WISHLIST APIs
export const fetchWishlist = () => API.get('/wishlist');
export const addToWishlist = (productId) => API.post('/wishlist', { productId });
export const removeFromWishlist = (productId) => API.delete(`/wishlist/${productId}`);

// ALERTS APIs
export const fetchAlerts = () => API.get('/alerts');
export const createAlert = (productId, targetPrice) => API.post('/alerts', { productId, targetPrice });
export const deleteAlert = (id) => API.delete(`/alerts/${id}`);
export const runAlertScanner = () => API.post('/alerts/check');

// NOTIFICATIONS APIs
export const fetchNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);

// GROQ AI APIs
export const fetchAIInsights = () => API.get('/ai/insights');
export const fetchProductAIAnalysis = (id) => API.get(`/ai/product/${id}`);
export const sendChatMessage = (message, context = {}) => API.post('/ai/chat', { message, context });

export default API;
