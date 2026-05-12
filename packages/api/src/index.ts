import 'reflect-metadata';
import { env } from './config/env.js';
import { buildApp } from './app.js';
import { AppDataSource } from './config/data-source.js';

async function main() {
  await AppDataSource.initialize();
  const app = buildApp();
  // Bind to :: so the server accepts both IPv4 and IPv6 connections.
  // On Linux (including Docker), :: with IPV6_V6ONLY=false also handles IPv4.
  app.listen(env.PORT, '::', () => {
    console.log(`API listening on port ${env.PORT}`);
  });
}

main().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
