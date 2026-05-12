import request from 'supertest';
import { buildApp } from '../../app.js';
import { makeUser, makeVacation } from '../../tests/factories.js';

const app = buildApp();

describe('GET /api/vacation-requests', () => {
  it('returns paginated envelope', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    for (let i = 1; i <= 25; i++) {
      const mm = String((i % 9) + 1).padStart(2, '0');
      const dd = String((i % 27) + 1).padStart(2, '0');
      await makeVacation(r, { startDate: `2099-${mm}-${dd}`, endDate: `2099-${mm}-${dd}` });
    }
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get('/api/vacation-requests?page=2&pageSize=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 25, page: 2, pageSize: 10 });
    expect(res.body.items).toHaveLength(10);
  });

  it('returns 403 to a Requester', async () => {
    const { token } = await makeUser({ role: 'Requester' });
    const res = await request(app)
      .get('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/vacation-requests — filters', () => {
  it('filters by status', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    await makeVacation(r, { startDate: '2099-01-01', endDate: '2099-01-05', status: 'Pending' });
    await makeVacation(r, { startDate: '2099-02-01', endDate: '2099-02-05', status: 'Approved' });
    await makeVacation(r, { startDate: '2099-03-01', endDate: '2099-03-05', status: 'Rejected' });

    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get('/api/vacation-requests?status=Approved')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].status).toBe('Approved');
  });

  it('filters by requesterId', async () => {
    const { user: a } = await makeUser({ email: 'a@example.com', role: 'Requester' });
    const { user: b } = await makeUser({ email: 'b@example.com', role: 'Requester' });
    await makeVacation(a, {});
    await makeVacation(b, {});
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get(`/api/vacation-requests?requesterId=${a.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].userId).toBe(a.id);
  });

  it('filters by date range', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    await makeVacation(r, { startDate: '2099-01-01', endDate: '2099-01-05' });
    await makeVacation(r, { startDate: '2099-06-01', endDate: '2099-06-05' });
    await makeVacation(r, { startDate: '2099-12-01', endDate: '2099-12-05' });
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get('/api/vacation-requests?from=2099-05-01&to=2099-09-01')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
  });

  it('filters by requester name (substring, case-insensitive)', async () => {
    const { user: a } = await makeUser({ name: 'Alice Adams', email: 'alice.adams@example.com', role: 'Requester' });
    const { user: b } = await makeUser({ name: 'Bob Brown',   email: 'bob.brown@example.com', role: 'Requester' });
    await makeVacation(a, { startDate: '2099-07-01', endDate: '2099-07-05' });
    await makeVacation(b, { startDate: '2099-07-10', endDate: '2099-07-15' });
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get('/api/vacation-requests?requester=ALICE')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].userId).toBe(a.id);
  });

  it('composes status + date filters', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    await makeVacation(r, { startDate: '2099-06-01', endDate: '2099-06-05', status: 'Pending' });
    await makeVacation(r, { startDate: '2099-06-10', endDate: '2099-06-15', status: 'Approved' });
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get('/api/vacation-requests?status=Pending&from=2099-06-01&to=2099-06-30')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].status).toBe('Pending');
  });
});

describe('GET /api/vacation-requests/:id (validator)', () => {
  it("can read any user's request with user info", async () => {
    const { user } = await makeUser({ email: 'subject@example.com', role: 'Requester' });
    const v = await makeVacation(user, { reason: 'family trip' });
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get(`/api/vacation-requests/${v.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(v.id);
    expect(res.body.user?.email).toBe('subject@example.com');
    expect(res.body.reason).toBe('family trip');
  });
});

describe('GET /api/vacation-requests/stats', () => {
  it('returns counts grouped by status', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    await makeVacation(r, { status: 'Pending' });
    await makeVacation(r, { status: 'Pending', startDate: '2099-02-01', endDate: '2099-02-05' });
    await makeVacation(r, { status: 'Approved', startDate: '2099-03-01', endDate: '2099-03-05' });

    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get('/api/vacation-requests/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pending: 2, approved: 1, rejected: 0 });
  });
});

describe('Cancelled handling for validators', () => {
  it('GET /api/vacation-requests excludes Cancelled by default', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    await makeVacation(r, { startDate: '2099-01-01', endDate: '2099-01-05', status: 'Pending' });
    await makeVacation(r, { startDate: '2099-02-01', endDate: '2099-02-05', status: 'Cancelled' });
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get('/api/vacation-requests')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].status).toBe('Pending');
  });

  it('explicit status=Cancelled filter does return cancelled rows', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    await makeVacation(r, { startDate: '2099-01-01', endDate: '2099-01-05', status: 'Cancelled' });
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get('/api/vacation-requests?status=Cancelled')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].status).toBe('Cancelled');
  });

  it('stats excludes Cancelled from all three counts', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    await makeVacation(r, { status: 'Pending' });
    await makeVacation(r, { startDate: '2099-02-01', endDate: '2099-02-05', status: 'Cancelled' });
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .get('/api/vacation-requests/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).toEqual({ pending: 1, approved: 0, rejected: 0 });
  });
});

describe('POST /api/vacation-requests/:id/approve and /reject', () => {
  it('approves a pending request', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    const req1 = await makeVacation(r, {});
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .post(`/api/vacation-requests/${req1.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Approved');
  });

  it('rejects a pending request and stores optional comments', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    const req1 = await makeVacation(r, {});
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .post(`/api/vacation-requests/${req1.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ comments: 'Conflicts with launch' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Rejected');
    expect(res.body.comments).toBe('Conflicts with launch');
  });

  it('returns 409 when the request is not Pending', async () => {
    const { user: r } = await makeUser({ role: 'Requester' });
    const req1 = await makeVacation(r, { status: 'Approved' });
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .post(`/api/vacation-requests/${req1.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(409);
  });

  it('returns 404 for a non-existent id', async () => {
    const { token } = await makeUser({ role: 'Validator' });
    const res = await request(app)
      .post('/api/vacation-requests/00000000-0000-0000-0000-000000000000/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(404);
  });

  it('returns 403 to a Requester', async () => {
    const { user: r, token } = await makeUser({ role: 'Requester' });
    const req1 = await makeVacation(r, {});
    const res = await request(app)
      .post(`/api/vacation-requests/${req1.id}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });
});
