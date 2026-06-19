let rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (rawApiUrl && !rawApiUrl.endsWith('/api') && !rawApiUrl.endsWith('/api/')) {
  rawApiUrl = rawApiUrl.replace(/\/$/, '') + '/api';
}
const API_BASE_URL = rawApiUrl;

// Helper to make fetch calls with auto JWT inclusion
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('gsoms_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { error: text };
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
};

export const api = {
  // Auth Endpoints
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      localStorage.setItem('gsoms_token', data.token);
      localStorage.setItem('gsoms_user', JSON.stringify(data.user));
    }
    return data;
  },

  register: async (name, email, password, role) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
  },

  logout: () => {
    localStorage.removeItem('gsoms_token');
    localStorage.removeItem('gsoms_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('gsoms_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Products & Stock Endpoints
  getProducts: async () => {
    return request('/products');
  },

  updateProductStock: async (productId, available_qty) => {
    return request(`/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ available_qty })
    });
  },

  // Orders Endpoints
  createOrder: async (delivery_address, notes, items) => {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify({ delivery_address, notes, items })
    });
  },

  getOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.customer) params.append('customer', filters.customer);

    const queryString = params.toString();
    return request(`/orders${queryString ? `?${queryString}` : ''}`);
  },

  getOrderById: async (orderId) => {
    return request(`/orders/${orderId}`);
  },

  updateOrderStatus: async (orderId, status) => {
    return request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Invoices Endpoints
  getInvoice: async (orderId) => {
    return request(`/invoices/${orderId}`);
  },

  // Insights Endpoints
  getInsights: async () => {
    return request('/insights');
  }
};
