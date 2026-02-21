import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD
  ? '/api/v1'
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1');

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Events / Bookings
export const createBooking = (data) => api.post('/events', data);
export const getAvailability = (fecha) => api.get('/events/availability', { params: { fecha } });
export const getMonthlyAvailability = (year, month) => api.get('/events/availability', { params: { year, month } });
export const getReservations = (params) => api.get('/events', { params });
export const updateReservation = (id, data) => api.patch(`/events/${id}`, data);
export const deleteReservation = (id) => api.delete(`/events/${id}`);
export const checkAvailability = (params) => api.get('/events/availability', { params });

// Config
export const getConfig = () => api.get('/config');
export const updateConfig = (data) => api.patch('/config', data);

// Workshops
export const getWorkshops = () => api.get('/workshops');
export const createWorkshop = (data) => api.post('/workshops', data);
export const updateWorkshop = (id, data) => api.patch(`/workshops/${id}`, data);
export const deleteWorkshop = (id) => api.delete(`/workshops/${id}`);

// Auth
export const login = (email, password) => api.post('/login', { email, password });

export default api;
