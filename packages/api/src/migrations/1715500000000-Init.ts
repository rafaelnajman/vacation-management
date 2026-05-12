import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1715500000000 implements MigrationInterface {
  name = 'Init1715500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('Requester', 'Validator')`);
    await queryRunner.query(
      `CREATE TYPE "vacation_status" AS ENUM ('Pending', 'Approved', 'Rejected')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"          varchar(120) NOT NULL,
        "email"         varchar(254) NOT NULL UNIQUE,
        "password_hash" varchar(72)  NOT NULL,
        "role"          "user_role"  NOT NULL,
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        "updated_at"    timestamptz  NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "vacation_requests" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "start_date" date NOT NULL,
        "end_date"   date NOT NULL,
        "reason"     text,
        "status"     "vacation_status" NOT NULL DEFAULT 'Pending',
        "comments"   text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_vac_dates" CHECK ("end_date" >= "start_date")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_vac_user_status" ON "vacation_requests"("user_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_vac_status_created" ON "vacation_requests"("status", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_vac_status_created"`);
    await queryRunner.query(`DROP INDEX "idx_vac_user_status"`);
    await queryRunner.query(`DROP TABLE "vacation_requests"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "vacation_status"`);
    await queryRunner.query(`DROP TYPE "user_role"`);
  }
}
