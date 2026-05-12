import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

export const http = axios.create({ baseURL: '/api', timeout: 10_000 });

http.interceptors.request.use(cfg => {
  const auth = useAuthStore();
  if (auth.token) {
    cfg.headers.Authorization = `Bearer ${auth.token}`;
  }
  return cfg;
});

http.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      const auth = useAuthStore();
      auth.logout();
    }
    return Promise.reject(err);
  },
);
