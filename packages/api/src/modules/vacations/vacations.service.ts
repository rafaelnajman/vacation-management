import { Repository } from 'typeorm';
import { VacationRequest } from '../../entities/VacationRequest.js';
import { AppError } from '../../utils/AppError.js';
import type {
  CreateVacationDTO,
  VacationRequestDTO,
  ListVacationsQuery,
  PaginatedVacations,
  VacationStats,
  DecideVacationDTO,
  Role,
} from '@vacation/shared';

export class VacationsService {
  constructor(
    private readonly vacationRepo: Repository<VacationRequest>,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async create(userId: string, dto: CreateVacationDTO): Promise<VacationRequestDTO> {
    this.assertStartDateFuture(dto.startDate);

    const overlap = await this.vacationRepo
      .createQueryBuilder('v')
      .where('v.userId = :uid', { uid: userId })
      .andWhere(`v.status IN ('Pending', 'Approved')`)
      .andWhere('v.startDate <= :end', { end: dto.endDate })
      .andWhere('v.endDate >= :start', { start: dto.startDate })
      .getOne();

    if (overlap) {
      throw AppError.conflict(
        'You already have a pending or approved request overlapping these dates',
        'OVERLAP',
      );
    }

    const saved = await this.vacationRepo.save(
      this.vacationRepo.create({
        userId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason ?? null,
        status: 'Pending',
        comments: null,
      }),
    );
    return this.toDTO(saved);
  }

  async listMine(userId: string): Promise<VacationRequestDTO[]> {
    const rows = await this.vacationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(r => this.toDTO(r));
  }

  async listAll(q: ListVacationsQuery): Promise<PaginatedVacations> {
    const qb = this.vacationRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.user', 'u')
      .orderBy('v.createdAt', 'DESC');

    if (q.status) qb.andWhere('v.status = :status', { status: q.status });
    if (q.requesterId) qb.andWhere('v.userId = :rid', { rid: q.requesterId });
    if (q.requester) {
      qb.andWhere(
        '(LOWER(u.name) LIKE :req OR LOWER(u.email) LIKE :req)',
        { req: `%${q.requester.toLowerCase()}%` },
      );
    }
    if (q.from) qb.andWhere('v.endDate >= :from', { from: q.from });
    if (q.to) qb.andWhere('v.startDate <= :to', { to: q.to });

    const total = await qb.getCount();
    const items = await qb
      .skip((q.page - 1) * q.pageSize)
      .take(q.pageSize)
      .getMany();

    return {
      total,
      page: q.page,
      pageSize: q.pageSize,
      items: items.map(i => this.toDTO(i)),
    };
  }

  async stats(): Promise<VacationStats> {
    const rows = await this.vacationRepo
      .createQueryBuilder('v')
      .select('v.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('v.status')
      .getRawMany<{ status: 'Pending' | 'Approved' | 'Rejected'; count: string }>();

    const out: VacationStats = { pending: 0, approved: 0, rejected: 0 };
    for (const r of rows) {
      if (r.status === 'Pending')  out.pending  = Number(r.count);
      if (r.status === 'Approved') out.approved = Number(r.count);
      if (r.status === 'Rejected') out.rejected = Number(r.count);
    }
    return out;
  }

  async getById(id: string, callerId: string, callerRole: Role): Promise<VacationRequestDTO> {
    const row = await this.vacationRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.user', 'u')
      .where('v.id = :id', { id })
      .getOne();

    if (!row) throw AppError.notFound('Vacation request not found');

    // Requesters can only see their own. Validators see all.
    if (callerRole === 'Requester' && row.userId !== callerId) {
      throw AppError.notFound('Vacation request not found'); // 404, not 403, to avoid leakage
    }

    return this.toDTO(row);
  }

  async decide(
    id: string,
    action: 'Approved' | 'Rejected',
    dto: DecideVacationDTO,
  ): Promise<VacationRequestDTO> {
    return this.vacationRepo.manager.transaction(async manager => {
      const repo = manager.getRepository(VacationRequest);
      const row = await repo
        .createQueryBuilder('v')
        .setLock('pessimistic_write')
        .where('v.id = :id', { id })
        .getOne();

      if (!row) throw AppError.notFound('Vacation request not found');
      if (row.status !== 'Pending') {
        throw AppError.conflict(`Request is already ${row.status}`, 'NOT_PENDING');
      }

      row.status = action;
      row.comments = dto.comments ?? null;
      const saved = await repo.save(row);
      return this.toDTO(saved);
    });
  }

  private assertStartDateFuture(startDate: string) {
    const today = this.clock().toISOString().slice(0, 10);
    if (startDate < today) {
      throw AppError.badRequest('startDate cannot be in the past', 'START_IN_PAST');
    }
  }

  toDTO(v: VacationRequest): VacationRequestDTO {
    return {
      id: v.id,
      userId: v.userId,
      startDate: v.startDate,
      endDate: v.endDate,
      reason: v.reason,
      status: v.status,
      comments: v.comments,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
      user: v.user
        ? { id: v.user.id, name: v.user.name, email: v.user.email, role: v.user.role }
        : undefined,
    };
  }
}
