import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source.js';

async function main() {
  await AppDataSource.initialize();
  const ran = await AppDataSource.runMigrations();
  console.log(`Ran ${ran.length} migration(s).`);
  await AppDataSource.destroy();
}

main().catch(err => {
  console.error('Migration run failed:', err);
  process.exit(1);
});
