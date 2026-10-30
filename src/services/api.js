import axios from "axios";
import { storage } from "../utils/storage";

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
export const TOKEN_KEY = "stepup.tokens";

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

export const tokenStore = {
  get: () => storage.get(TOKEN_KEY),
  set: (tokens) => storage.set(TOKEN_KEY, tokens),
  clear: () => storage.remove(TOKEN_KEY),
};

api.interceptors.request.use((config) => {
  const tokens = tokenStore.get();
  if (tokens?.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

let refreshing = null; // one refresh at a time, shared by concurrent 401s

async function refreshAccessToken() {
  const tokens = tokenStore.get();
  if (!tokens?.refresh) throw new Error("no refresh token");
  const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh: tokens.refresh });
  tokenStore.set({ access: data.access, refresh: data.refresh || tokens.refresh });
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/register") || original?.url?.includes("token/refresh");
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall && tokenStore.get()?.refresh) {
      original._retried = true;
      try {
        refreshing = refreshing || refreshAccessToken().finally(() => (refreshing = null));
        const access = await refreshing;
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch {
        tokenStore.clear();
        window.dispatchEvent(new Event("stepup:logout"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
