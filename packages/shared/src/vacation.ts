import { z } from 'zod';

export type VacationStatus = 'Pending' | 'Approved' | 'Rejected';

export const vacationStatusSchema = z.enum(['Pending', 'Approved', 'Rejected']);

// ISO YYYY-MM-DD date string
const isoDate = z.iso.date();

export const createVacationSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    reason: z.string().trim().max(1000).optional(),
  })
  .refine(d => d.endDate >= d.startDate, {
    path: ['endDate'],
    message: 'endDate must be on or after startDate',
  });
export type CreateVacationDTO = z.infer<typeof createVacationSchema>;

export const decideVacationSchema = z.object({
  comments: z.string().trim().max(2000).optional(),
});
export type DecideVacationDTO = z.infer<typeof decideVacationSchema>;

export const listVacationsQuerySchema = z.object({
  status: vacationStatusSchema.optional(),
  requesterId: z.string().uuid().optional(),
  requester:   z.string().trim().min(1).max(254).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListVacationsQuery = z.infer<typeof listVacationsQuerySchema>;

export interface VacationRequestDTO {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: VacationStatus;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string; role: 'Requester' | 'Validator' };
}

export interface PaginatedVacations {
  items: VacationRequestDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VacationStats {
  pending: number;
  approved: number;
  rejected: number;
}
