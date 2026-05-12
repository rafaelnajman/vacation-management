import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env.js';
import { User } from '../entities/User.js';
import { VacationRequest } from '../entities/VacationRequest.js';
import { Init1715500000000 } from '../migrations/1715500000000-Init.js';

const databaseUrl =
  env.NODE_ENV === 'test' && env.TEST_DATABASE_URL
    ? env.TEST_DATABASE_URL
    : env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: false,
  logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
  entities: [User, VacationRequest],
  migrations: [Init1715500000000],
  migrationsRun: false,
});
