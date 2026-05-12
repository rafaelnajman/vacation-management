import request from 'supertest';
import { buildApp } from '../../app.js';
import { makeUser } from '../../tests/factories.js';

const app = buildApp();


describe('POST /api/auth/register', () => {
  it('creates a user and returns token + safe user (no password_hash)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
        role: 'Requester',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
      role: 'Requester',
    });
    expect(res.body.user.id).toEqual(expect.any(String));
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('rejects duplicate email with 409', async () => {
    const payload = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123!',
      role: 'Requester' as const,
    };
    await request(app).post('/api/auth/register').send(payload).expect(201);
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it.each([
    ['short password', { password: 'short' }],
    ['invalid email',  { email: 'not-an-email' }],
    ['missing role',   { role: undefined }],
  ])('rejects %s with 400 + Zod issues', async (_, override) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
        role: 'Requester',
        ...override,
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.issues).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 + token for valid credentials', async () => {
    const { user, password } = await makeUser({ email: 'log@example.com' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('log@example.com');
  });

  it('returns 401 for wrong password', async () => {
    const { user } = await makeUser({ email: 'wp@example.com' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WRONG_PASSWORD_123!' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BAD_CREDENTIALS');
  });

  it('returns 401 for unknown email (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever1!' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('BAD_CREDENTIALS');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const { user, token } = await makeUser({ email: 'me@example.com' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.email).toBe('me@example.com');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
