import type { AuthResponse, LoginDTO, RegisterDTO, SafeUser } from '@vacation/shared';
import { http } from './http';

export const authApi = {
  register: (dto: RegisterDTO) => http.post<AuthResponse>('/auth/register', dto).then(r => r.data),
  login:    (dto: LoginDTO)    => http.post<AuthResponse>('/auth/login', dto).then(r => r.data),
  me:       ()                  => http.get<{ user: SafeUser }>('/auth/me').then(r => r.data.user),
};
