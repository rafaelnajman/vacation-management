import {
  createVacationSchema,
  loginSchema,
  registerSchema,
} from '@vacation/shared';

describe('createVacationSchema', () => {
  it('rejects endDate before startDate', () => {
    const r = createVacationSchema.safeParse({ startDate: '2099-07-10', endDate: '2099-07-05' });
    expect(r.success).toBe(false);
  });

  it('accepts equal start and end (single-day request)', () => {
    const r = createVacationSchema.safeParse({ startDate: '2099-07-10', endDate: '2099-07-10' });
    expect(r.success).toBe(true);
  });

  it('rejects reason over max length 1000', () => {
    const r = createVacationSchema.safeParse({
      startDate: '2099-07-10',
      endDate: '2099-07-11',
      reason: 'x'.repeat(1001),
    });
    expect(r.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('lowercases email', () => {
    const r = registerSchema.safeParse({
      name: 'A', email: 'A@B.COM', password: 'Password123!', role: 'Requester',
    });
    expect(r.success && r.data.email).toBe('a@b.com');
  });

  it('rejects short password', () => {
    const r = registerSchema.safeParse({
      name: 'A', email: 'a@b.com', password: 'short', role: 'Requester',
    });
    expect(r.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('trims and lowercases email', () => {
    const r = loginSchema.safeParse({ email: '  A@B.COM  ', password: 'x' });
    expect(r.success && r.data.email).toBe('a@b.com');
  });
});
