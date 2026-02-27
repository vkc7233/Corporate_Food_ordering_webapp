import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getMe: () => api.get('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
};

// ─── Restaurants ───────────────────────────────────────────────
export const restaurantService = {
  getAll: () => api.get('/restaurants'),
  
  getById: (id: string) => api.get(`/restaurants/${id}`),
  
  getMenu: (id: string) => api.get(`/restaurants/${id}/menu`),
};

// ─── Orders ────────────────────────────────────────────────────
export const orderService = {
  getAll: (status?: string) =>
    api.get('/orders', { params: status ? { status } : {} }),
  
  getById: (id: string) => api.get(`/orders/${id}`),
  
  create: (data: { restaurant_id: string; items: { menu_item_id: string; quantity: number }[]; notes?: string }) =>
    api.post('/orders', data),
  
  updateItems: (id: string, items: { menu_item_id: string; quantity: number }[]) =>
    api.put(`/orders/${id}/items`, { items }),
  
  place: (id: string, payment_method_id: string) =>
    api.post(`/orders/${id}/place`, { payment_method_id }),
  
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
};

// ─── Payment Methods ───────────────────────────────────────────
export const paymentService = {
  getAll: () => api.get('/payment-methods'),
  
  create: (data: { type: string; details: Record<string, string>; is_default?: boolean }) =>
    api.post('/payment-methods', data),
  
  update: (id: string, data: Partial<{ type: string; details: Record<string, string>; is_default: boolean }>) =>
    api.put(`/payment-methods/${id}`, data),
  
  delete: (id: string) => api.delete(`/payment-methods/${id}`),
};

export default api;
