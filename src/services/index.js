import api from "./api";

export const productService = {
  list: (params) => api.get("/products/", { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}/`).then((r) => r.data),
  categories: () => api.get("/categories/").then((r) => r.data),
  settings: () => api.get("/store-settings/").then((r) => r.data),
};

export const authService = {
  register: (payload) => api.post("/auth/register/", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login/", payload).then((r) => r.data),
  logout: (refresh) => api.post("/auth/logout/", { refresh }),
  profile: () => api.get("/auth/profile/").then((r) => r.data),
  updateProfile: (payload) => api.patch("/auth/profile/", payload).then((r) => r.data),
  addresses: () => api.get("/auth/addresses/").then((r) => r.data),
  addAddress: (payload) => api.post("/auth/addresses/", payload).then((r) => r.data),
  updateAddress: (id, payload) => api.patch(`/auth/addresses/${id}/`, payload).then((r) => r.data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}/`),
};

export const cartService = {
  get: () => api.get("/cart/").then((r) => r.data),
  add: (line) => api.post("/cart/items/", line).then((r) => r.data),
  update: (id, quantity) => api.patch(`/cart/items/${id}/`, { quantity }).then((r) => r.data),
  remove: (id) => api.delete(`/cart/items/${id}/`).then((r) => r.data),
  clear: () => api.delete("/cart/").then((r) => r.data),
  sync: (items) => api.post("/cart/sync/", { items }).then((r) => r.data),
};

export const orderService = {
  create: (payload) => api.post("/orders/", payload).then((r) => r.data),
  list: (page = 1) => api.get("/orders/", { params: { page } }).then((r) => r.data),
  get: (id) => api.get(`/orders/${id}/`).then((r) => r.data),
};

export const contactService = {
  send: (payload) => api.post("/contact/", payload).then((r) => r.data),
};
