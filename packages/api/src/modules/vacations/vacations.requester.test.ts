import request from 'supertest';
import { buildApp } from '../../app.js';
import { makeUser, makeVacation } from '../../tests/factories.js';

const app = buildApp();

describe('POST /api/vacation-requests', () => {
  it('creates a Pending request as a Requester', async () => {
    const { token } = await makeUser({ role: 'Requester' });
    const res = await request(app)
      .post('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2099-07-01', endDate: '2099-07-05', reason: 'family trip' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      startDate: '2099-07-01',
      endDate: '2099-07-05',
      reason: 'family trip',
      status: 'Pending',
      comments: null,
    });
  });
});

describe('POST /api/vacation-requests — date validation', () => {
  it('rejects endDate before startDate (400 with Zod issue under endDate)', async () => {
    const { token } = await makeUser({ role: 'Requester' });
    const res = await request(app)
      .post('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2099-07-10', endDate: '2099-07-05' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(JSON.stringify(res.body.issues)).toContain('endDate');
  });

  it('rejects startDate in the past', async () => {
    const { token } = await makeUser({ role: 'Requester' });
    const res = await request(app)
      .post('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2000-01-01', endDate: '2000-01-05' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('START_IN_PAST');
  });
});

describe('POST /api/vacation-requests — overlap detection', () => {
  it('rejects overlap with own pending request (409)', async () => {
    const { user, token } = await makeUser({ role: 'Requester' });
    await makeVacation(user, { startDate: '2099-07-01', endDate: '2099-07-10', status: 'Pending' });
    const res = await request(app)
      .post('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2099-07-05', endDate: '2099-07-15' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('OVERLAP');
  });

  it('rejects overlap with own approved request (409)', async () => {
    const { user, token } = await makeUser({ role: 'Requester' });
    await makeVacation(user, { startDate: '2099-08-01', endDate: '2099-08-10', status: 'Approved' });
    const res = await request(app)
      .post('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2099-08-09', endDate: '2099-08-12' });
    expect(res.status).toBe(409);
  });

  it('allows overlap with own rejected request', async () => {
    const { user, token } = await makeUser({ role: 'Requester' });
    await makeVacation(user, { startDate: '2099-09-01', endDate: '2099-09-10', status: 'Rejected' });
    const res = await request(app)
      .post('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2099-09-05', endDate: '2099-09-08' });
    expect(res.status).toBe(201);
  });

  it("does not block on another user's overlapping request", async () => {
    const { user: other } = await makeUser({ role: 'Requester', email: 'other@example.com' });
    await makeVacation(other, { startDate: '2099-10-01', endDate: '2099-10-10', status: 'Pending' });

    const { token } = await makeUser({ role: 'Requester', email: 'self@example.com' });
    const res = await request(app)
      .post('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2099-10-05', endDate: '2099-10-08' });
    expect(res.status).toBe(201);
  });
});

describe('Requester-only routes', () => {
  it('returns 403 when a Validator calls POST /api/vacation-requests', async () => {
    const { token } = await makeUser({ role: 'Validator', email: 'val@example.com' });
    const res = await request(app)
      .post('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2099-07-01', endDate: '2099-07-05' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/vacation-requests/:id (requester)', () => {
  it('returns own request by id', async () => {
    const { user, token } = await makeUser({ role: 'Requester' });
    const v = await makeVacation(user, {});
    const res = await request(app)
      .get(`/api/vacation-requests/${v.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(v.id);
  });

  it("returns 404 for another user's request (no leakage)", async () => {
    const { user: other } = await makeUser({ role: 'Requester', email: 'other@example.com' });
    const v = await makeVacation(other, {});
    const { token } = await makeUser({ role: 'Requester', email: 'self@example.com' });
    const res = await request(app)
      .get(`/api/vacation-requests/${v.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/vacation-requests/me', () => {
  it("returns only the caller's requests", async () => {
    const { user: alice, token: aliceToken } = await makeUser({ email: 'alice@example.com', role: 'Requester' });
    const { user: bob } = await makeUser({ email: 'bob@example.com', role: 'Requester' });
    await makeVacation(alice, { startDate: '2099-01-01', endDate: '2099-01-05' });
    await makeVacation(alice, { startDate: '2099-02-01', endDate: '2099-02-05' });
    await makeVacation(bob,   { startDate: '2099-01-01', endDate: '2099-01-05' });

    const res = await request(app)
      .get('/api/vacation-requests/me')
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((r: { userId: string }) => r.userId === alice.id)).toBe(true);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/vacation-requests/me');
    expect(res.status).toBe(401);
  });
});
