const BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

export class ApiError extends Error {
  constructor(status, message, errors, data) {
    super(message);
    this.status = status;
    this.errors = errors || {};
    this.data = data;
  }
}

const FRIENDLY = 'We couldn\u2019t reach the server. Please check your connection and try again.';

async function request(path, { method = 'GET', json, form, signal } = {}) {
  const headers = {};
  let body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body, signal, credentials: 'include' });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, FRIENDLY);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.message || 'Something went wrong. Please try again.', data?.errors, data);
  }
  return data;
}

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

/** Upload with progress (fetch cannot report upload progress). */
function upload(path, file, fieldName, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}${path}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(xhr.status, data?.message || 'The image could not be uploaded.', data?.errors));
    };
    xhr.onerror = () => reject(new ApiError(0, FRIENDLY));
    const fd = new FormData();
    fd.append(fieldName, file);
    xhr.send(fd);
  });
}

export const api = {
  // storefront
  settings: (signal) => request('/settings/public', { signal }),
  paymentInfo: (signal) => request('/settings/payment', { signal }),
  categories: (signal) => request('/categories', { signal }),
  products: (params, signal) => request(`/products${qs(params)}`, { signal }),
  product: (slug, signal) => request(`/products/${encodeURIComponent(slug)}`, { signal }),
  createOrder: (formData) => request('/orders', { method: 'POST', form: formData }),

  // admin
  admin: {
    login: (email, password) => request('/admin/login', { method: 'POST', json: { email, password } }),
    logout: () => request('/admin/logout', { method: 'POST' }),
    me: () => request('/admin/me'),
    stats: () => request('/admin/stats'),
    product: (id) => request(`/admin/products/${id}`),
    createProduct: (data) => request('/admin/products', { method: 'POST', json: data }),
    updateProduct: (id, data) => request(`/admin/products/${id}`, { method: 'PUT', json: data }),
    deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
    createCategory: (data) => request('/admin/categories', { method: 'POST', json: data }),
    updateCategory: (id, data) => request(`/admin/categories/${id}`, { method: 'PUT', json: data }),
    deleteCategory: (id, reassignTo) => request(`/admin/categories/${id}${qs({ reassignTo })}`, { method: 'DELETE' }),
    uploadImage: (file, kind, onProgress) => upload(`/admin/uploads/image?kind=${kind}`, file, 'image', onProgress),
    orders: (params) => request(`/admin/orders${qs(params)}`),
    order: (id) => request(`/admin/orders/${id}`),
    updateOrder: (id, data) => request(`/admin/orders/${id}`, { method: 'PATCH', json: data }),
    deleteOrder: (id) => request(`/admin/orders/${id}`, { method: 'DELETE' }),
    settings: () => request('/admin/settings'),
    updateSettings: (data) => request('/admin/settings', { method: 'PUT', json: data }),
  },
};
