import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source.js';
import { User } from '../entities/User.js';
import { VacationRequest } from '../entities/VacationRequest.js';
import type { Role, VacationStatus } from '@vacation/shared';
import { env } from '../config/env.js';

let counter = 0;

export async function makeUser(overrides: Partial<{
  name: string;
  email: string;
  password: string;
  role: Role;
}> = {}): Promise<{ user: User; token: string; password: string }> {
  counter += 1;
  const password = overrides.password ?? 'Password123!';
  const passwordHash = await bcrypt.hash(password, 4); // low cost in tests
  const repo = AppDataSource.getRepository(User);
  const user = await repo.save(
    repo.create({
      name: overrides.name ?? `User ${counter}`,
      email: overrides.email ?? `user${counter}@example.com`,
      passwordHash,
      role: overrides.role ?? 'Requester',
    }),
  );
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
  return { user, token, password };
}

export async function makeVacation(
  user: User,
  overrides: Partial<{
    startDate: string;
    endDate: string;
    status: VacationStatus;
    reason: string | null;
    comments: string | null;
  }> = {},
): Promise<VacationRequest> {
  const repo = AppDataSource.getRepository(VacationRequest);
  return repo.save(
    repo.create({
      userId: user.id,
      startDate: overrides.startDate ?? '2099-01-01',
      endDate: overrides.endDate ?? '2099-01-05',
      reason: overrides.reason ?? null,
      status: overrides.status ?? 'Pending',
      comments: overrides.comments ?? null,
    }),
  );
}
