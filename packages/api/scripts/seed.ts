import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../src/config/data-source.js';
import { User } from '../src/entities/User.js';
import { VacationRequest } from '../src/entities/VacationRequest.js';

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const vacRepo  = AppDataSource.getRepository(VacationRequest);

  // ── Users ──────────────────────────────────────────────────────────────────
  const userDefs = [
    { name: 'Alice Requester', email: 'alice@example.com',  password: 'Demo123!',     role: 'Requester' as const },
    { name: 'Bob Validator',   email: 'bob@example.com',    password: 'Validator123!', role: 'Validator' as const },
    { name: 'Carol Dupont',    email: 'carol@example.com',  password: 'Demo123!',     role: 'Requester' as const },
    { name: 'Daniel Martin',   email: 'daniel@example.com', password: 'Demo123!',     role: 'Requester' as const },
    { name: 'Elena Sorel',     email: 'elena@example.com',  password: 'Demo123!',     role: 'Requester' as const },
  ];

  const userMap: Record<string, User> = {};

  for (const u of userDefs) {
    let user = await userRepo.findOne({ where: { email: u.email } });
    if (user) {
      console.log(`User ${u.email} already exists, skipping.`);
    } else {
      const passwordHash = await bcrypt.hash(u.password, 10);
      user = await userRepo.save(userRepo.create({ ...u, passwordHash }));
      console.log(`Created ${u.email} (${u.role}).`);
    }
    userMap[u.email] = user;
  }

  // ── Vacation requests ──────────────────────────────────────────────────────
  type VacDef = {
    email: string;
    startDate: string;
    endDate: string;
    reason?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    comments?: string;
  };

  const vacDefs: VacDef[] = [
    // Alice — 1 fresh Pending
    {
      email: 'alice@example.com',
      startDate: '2026-09-01', endDate: '2026-09-07',
      reason: 'Summer holiday',
      status: 'Pending',
    },
    // Carol — 1 Pending (mid-summer), 1 Approved (winter, ski trip)
    {
      email: 'carol@example.com',
      startDate: '2026-07-14', endDate: '2026-07-21',
      reason: 'Mid-summer break',
      status: 'Pending',
    },
    {
      email: 'carol@example.com',
      startDate: '2026-12-22', endDate: '2026-12-31',
      reason: 'Family ski trip to Chamonix',
      status: 'Approved',
    },
    // Daniel — 1 Pending (early autumn), 1 Rejected (overlap with team launch)
    {
      email: 'daniel@example.com',
      startDate: '2026-10-05', endDate: '2026-10-10',
      reason: "Cousin's wedding",
      status: 'Pending',
    },
    {
      email: 'daniel@example.com',
      startDate: '2026-08-10', endDate: '2026-08-17',
      reason: 'Late summer holiday',
      status: 'Rejected',
      comments: 'Conflicts with the August release window',
    },
    // Elena — 1 Approved (spring), 1 Pending (Christmas)
    {
      email: 'elena@example.com',
      startDate: '2026-04-06', endDate: '2026-04-12',
      reason: 'Spring break',
      status: 'Approved',
    },
    {
      email: 'elena@example.com',
      startDate: '2026-12-23', endDate: '2027-01-02',
      reason: 'Annual holiday trip',
      status: 'Pending',
    },
  ];

  for (const v of vacDefs) {
    const user = userMap[v.email];
    if (!user) { console.warn(`No user found for ${v.email}, skipping.`); continue; }

    // Idempotency: skip if a request with exact same dates already exists for this user
    const existing = await vacRepo.findOne({
      where: { userId: user.id, startDate: v.startDate, endDate: v.endDate },
    });
    if (existing) {
      console.log(`  Vacation for ${v.email} (${v.startDate}→${v.endDate}) already exists, skipping.`);
      continue;
    }

    const req = vacRepo.create({
      userId: user.id,
      startDate: v.startDate,
      endDate:   v.endDate,
      reason:    v.reason ?? null,
      status:    v.status,
      comments:  v.comments ?? null,
    });
    await vacRepo.save(req);
    console.log(`  Created vacation [${v.status}] for ${v.email}: ${v.startDate} → ${v.endDate}`);
  }

  await AppDataSource.destroy();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
