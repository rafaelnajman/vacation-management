import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancelledStatus1715600000000 implements MigrationInterface {
  name = 'AddCancelledStatus1715600000000';
  // Postgres ALTER TYPE ... ADD VALUE cannot run inside a transaction.
  transaction = false as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "vacation_status" ADD VALUE IF NOT EXISTS 'Cancelled'`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Postgres doesn't support removing enum values cleanly without recreating
    // the type. Leaving down() empty is the pragmatic choice — rolling forward
    // is the expected path.
  }
}
