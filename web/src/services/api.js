import axios from 'axios';

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

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
export const getReservationById = (id) => api.get(`/events/${id}`);
export const getPublicReservationById = (id) => api.get(`/events/${id}/public`);
export const getInvitationDetails = (id) => api.get(`/events/invitation/${id}`);
export const updateReservation = (id, data) => api.patch(`/events/${id}`, data);
export const deleteReservation = (id) => api.delete(`/events/${id}`);
export const checkAvailability = (params) => api.get('/events/availability', { params });

// Config
export const getConfig = () => api.get('/config');
export const updateConfig = (data) => api.patch('/config', data);
export const uploadConfigImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/config/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Workshops (actividades extras para cumpleaños — config)
export const getWorkshops = () => api.get('/workshops');
export const createWorkshop = (data) => api.post('/workshops', data);
export const updateWorkshop = (id, data) => api.patch(`/workshops/${id}`, data);
export const deleteWorkshop = (id) => api.delete(`/workshops/${id}`);

// Talleres (sesiones programadas independientes)
export const getTalleres = (params) => api.get('/talleres', { params }); // Admin: todos
export const getPublicTalleres = (params) => api.get('/talleres/public', { params }); // Público: solo publicados
export const getTallerById = (id) => api.get(`/talleres/${id}`);
export const createTaller = (data) => api.post('/talleres', data);
export const updateTaller = (id, data) => api.patch(`/talleres/${id}`, data);
export const deleteTaller = (id) => api.delete(`/talleres/${id}`);
export const inscribirATaller = (id, data) => api.post(`/talleres/${id}/inscripciones`, data);
export const eliminarInscripcion = (tallerId, inscripcionId) =>
	api.delete(`/talleres/${tallerId}/inscripciones/${inscripcionId}`);
export const editarInscripcion = (tallerId, inscripcionId, data) =>
	api.patch(`/talleres/${tallerId}/inscripciones/${inscripcionId}`, data);
export const uploadTallerImage = (file) => {
	const formData = new FormData();
	formData.append('image', file);
	return api.post('/talleres/upload', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
};
export const deleteTallerImage = (imageUrl) => api.post('/talleres/upload/delete', { imageUrl });

// Auth
export const login = (email, password) => api.post('/login', { email, password });

export default api;
