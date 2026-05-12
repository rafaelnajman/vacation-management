import { AppDataSource } from '../config/data-source.js';

describe('infrastructure', () => {
  it('connects to the test database', async () => {
    const result = await AppDataSource.query('SELECT 1 as one');
    expect(result[0].one).toBe(1);
  });

  it('truncates users between tests (precondition)', async () => {
    const result = await AppDataSource.query('SELECT COUNT(*) AS n FROM users');
    expect(Number(result[0].n)).toBe(0);
  });
});
