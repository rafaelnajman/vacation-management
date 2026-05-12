import type {
  CreateVacationDTO,
  DecideVacationDTO,
  ListVacationsQuery,
  PaginatedVacations,
  UpdateVacationDTO,
  VacationRequestDTO,
  VacationStats,
} from '@vacation/shared';
import { http } from './http';

export const vacationsApi = {
  create:   (dto: CreateVacationDTO) =>
    http.post<VacationRequestDTO>('/vacation-requests', dto).then(r => r.data),
  listMine: () => http.get<VacationRequestDTO[]>('/vacation-requests/me').then(r => r.data),
  listAll:  (q: Partial<ListVacationsQuery>) =>
    http.get<PaginatedVacations>('/vacation-requests', { params: q }).then(r => r.data),
  stats:    () => http.get<VacationStats>('/vacation-requests/stats').then(r => r.data),
  getById:  (id: string) =>
    http.get<VacationRequestDTO>(`/vacation-requests/${id}`).then(r => r.data),
  approve:  (id: string, dto: DecideVacationDTO = {}) =>
    http.post<VacationRequestDTO>(`/vacation-requests/${id}/approve`, dto).then(r => r.data),
  reject:   (id: string, dto: DecideVacationDTO = {}) =>
    http.post<VacationRequestDTO>(`/vacation-requests/${id}/reject`, dto).then(r => r.data),
  update: (id: string, dto: UpdateVacationDTO) =>
    http.patch<VacationRequestDTO>(`/vacation-requests/${id}`, dto).then(r => r.data),
  cancel: (id: string) =>
    http.post<VacationRequestDTO>(`/vacation-requests/${id}/cancel`).then(r => r.data),
};
