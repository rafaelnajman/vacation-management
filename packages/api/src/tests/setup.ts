import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../config/data-source.js';

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

beforeEach(async () => {
  // Wipe rows; keep schema. CASCADE handles FKs.
  await AppDataSource.query(`TRUNCATE TABLE "vacation_requests", "users" RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});
