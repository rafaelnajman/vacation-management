import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../config/data-source.js';

export default async function globalSetup() {
  process.env.NODE_ENV = 'test';
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();
}
