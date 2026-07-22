import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/me')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  resetPasswordAdmin: (data) => api.put('/auth/reset-password-admin', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
};

export const users = {
  getAll: () => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const clients = {
  getAll: () => api.get('/clients/'),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients/', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

export const equipments = {
  getAll: () => api.get('/equipments/'),
  getOne: (id) => api.get(`/equipments/${id}`),
  create: (data) => api.post('/equipments/', data),
  update: (id, data) => api.put(`/equipments/${id}`, data),
  delete: (id) => api.delete(`/equipments/${id}`),
};

export const workOrders = {
  getAll: (params) => api.get('/work-orders/', { params }),
  getOne: (id) => api.get(`/work-orders/${id}`),
  getMisOrdenes: () => api.get('/work-orders/mis-ordenes'),
  getOrdenesItems: () => api.get('/work-orders/ordenes-items'),
  create: (data) => api.post('/work-orders/', data),
  recepcion: (data) => api.post('/work-orders/recepcion', data),
  update: (id, data) => api.put(`/work-orders/${id}`, data),
  updateEstado: (id, data) => api.put(`/work-orders/${id}/estado`, data),
  updateNotas: (id, data) => api.put(`/work-orders/${id}/notas`, data),
  updateItemsListos: (id, data) => api.put(`/work-orders/${id}/items-listos`, data),
  updateItemsValidados: (id, data) => api.put(`/work-orders/${id}/items-validados`, data),
  getEstados: () => api.get('/work-orders/estados'),
};

export const photos = {
  upload: (orderId, file) => {
    const formData = new FormData();
    formData.append('foto', file);
    return api.post(`/photos/${orderId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get: (orderId) => api.get(`/photos/${orderId}`),
};

export const statusHistory = {
  getByOrder: (orderId) => api.get(`/status-history/${orderId}`),
};

export const qr = {
  download: async (orderId) => {
    const response = await fetch(`/api/qr/${orderId}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Error al generar QR');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etiqueta_${orderId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const payments = {
  getByOrder: (orderId) => api.get(`/payments/${orderId}`),
  create: (orderId, formData) => api.post(`/payments/${orderId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (paymentId) => api.delete(`/payments/${paymentId}`),
};

export const notifications = {
  getAll: () => api.get('/notifications/'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

export const pagosSemanales = {
  getAll: () => api.get('/pagos-semanales/'),
  generar: (data) => api.post('/pagos-semanales/generar', data),
  validar: (id, data) => api.put(`/pagos-semanales/${id}/validar`, data),
  delete: (id) => api.delete(`/pagos-semanales/${id}`),
};

export default api;
