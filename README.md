# Vacation Management

A two-interface vacation request management system built for the Travelfactory web developer recruitment assignment.

- **Requester interface** — employees submit vacation requests and view the status of their own submissions.
- **Validator interface** — managers review all requests, filter, approve, or reject them.

## Features

### Requester

- Submit vacation requests with start/end dates and an optional reason.
- View own requests in a paginated table with live status.
- **Edit** a still-pending request from the detail drawer.
- **Cancel** a pending request (transitions to `Cancelled`, removed from the validator's queue).
- Inline form validation reusing the same Zod schemas the API uses (single source of truth).

### Validator

- Stats dashboard with clickable filter cards (Pending / Approved / Rejected).
- Filter all requests by status, requester name/email, and date range.
- Approve via confirm dialog; reject via modal with a required reason (UI-enforced).
- A small "edited" pill appears next to the submitted date when a Pending request was modified after submission.
- Paginated, sortable, lazy-loaded table.

### Cross-cutting

- JWT-based authentication, role-aware route guards.
- Overlap detection on submit and on edit (cannot submit/extend a pending/approved request overlapping the requester's existing ones; editing excludes the row being edited from the candidate set).
- DB-level CHECK constraint enforces `end_date >= start_date`.
- Same Zod schemas used to validate input on both the client and the server.
- Click-row detail drawer with submitted/decided timeline and inline actions.
- Decision stamp animation (passport-style "APPROVED"/"REJECTED" overlay) when a validator decides.

## Quick start

```bash
git clone <repo>
cd vacation-management

npm run setup       # copies .env, installs deps, brings up db+api in Docker, runs migrations, seeds demo data
npm run dev:web     # starts the frontend at http://localhost:5173 (or :5174 if 5173 is taken)
```

That's it. `npm run setup` is idempotent — safe to run again. It takes ~30s from a cold start.

**Prerequisites:** Docker (with the Compose plugin), Node 22 LTS or newer.

Other useful scripts:

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `npm run setup`        | One-shot: install + Docker up + seed                        |
| `npm run stack:up`     | Just (re)build and start db + api                           |
| `npm run stack:down`   | Stop the Docker stack                                       |
| `npm run seed`         | Re-run the seed against the running stack (idempotent)      |
| `npm run dev:web`      | Vite dev server for the frontend                            |
| `npm run dev:api`      | Run the API locally with hot-reload (instead of via Docker) |
| `npm run test:api`     | Run the backend test suite                                  |
| `npm run typecheck`    | Typecheck all workspaces                                    |
| `npm run format`       | Run Prettier on all source files                            |
| `npm run format:check` | Verify all source files are Prettier-clean (good for CI)    |

> **macOS note:** If `curl http://localhost:3000` fails but `curl http://127.0.0.1:3000` succeeds, that's the macOS IPv6/Docker quirk. The Vite dev proxy uses `localhost` internally and works fine; only direct CLI requests to the API container hit this.

## Demo users

| Email                | Password        | Role      |
| -------------------- | --------------- | --------- |
| `alice@example.com`  | `Demo123!`      | Requester |
| `carol@example.com`  | `Demo123!`      | Requester |
| `daniel@example.com` | `Demo123!`      | Requester |
| `elena@example.com`  | `Demo123!`      | Requester |
| `bob@example.com`    | `Validator123!` | Validator |

The seed also creates 7 vacation requests spread across Pending / Approved / Rejected so the validator dashboard demos with real-feeling data.

## Architecture

Monorepo with npm workspaces:

```text
.
├─ docker-compose.yml          # postgres + api
├─ docker-compose.test.yml     # isolated postgres for tests
├─ package.json                # workspaces root
└─ packages/
   ├─ shared/                  # TS types + Zod schemas (source-only)
   ├─ api/                     # Express 5 + TypeORM + Postgres + JWT
   └─ web/                     # Vue 3 + Vite + PrimeVue 4
```

- **`shared`** is consumed by both `api` and `web` via TS path aliases — no build step. The same Zod schemas validate on both sides so client and server validation cannot drift.
- **`api`** runs in Docker. Migrations run automatically on container start.
- **`web`** runs locally via Vite (proxies `/api/*` to `http://localhost:3000` in development).

## Architecture and patterns used

The backend deliberately demonstrates standard OOP and design patterns:

- **Repository pattern** — TypeORM repositories encapsulate data access.
- **Service layer with Dependency Injection** — service classes take their repositories (and a `clock` for testability) through constructor parameters.
- **DTO pattern** — Zod schemas define the wire contract; parsed objects are typed DTOs consumed by services.
- **Middleware pattern** — Express middleware chain composes authentication, validation, and error handling.
- **Factory pattern** — `AppError.notFound`, `AppError.conflict`, `AppError.forbidden` factories produce consistent typed errors.
- **Single Responsibility** — each module (`auth`, `vacations`) owns its router, service, and tests; each file has one clear job.

## API documentation

| Method | Path                                 | Auth | Role      | Description                                                               |
| ------ | ------------------------------------ | ---- | --------- | ------------------------------------------------------------------------- |
| POST   | `/api/auth/register`                 | –    | –         | Create account + return JWT.                                              |
| POST   | `/api/auth/login`                    | –    | –         | Login + return JWT.                                                       |
| GET    | `/api/auth/me`                       | JWT  | any       | Return the current user.                                                  |
| POST   | `/api/vacation-requests`             | JWT  | Requester | Submit a request.                                                         |
| GET    | `/api/vacation-requests/me`          | JWT  | Requester | List the caller's own requests.                                           |
| GET    | `/api/vacation-requests`             | JWT  | Validator | Paginated list with filters (excludes `Cancelled` by default).            |
| GET    | `/api/vacation-requests/stats`       | JWT  | Validator | Counts grouped by status (Pending/Approved/Rejected only).                |
| GET    | `/api/vacation-requests/:id`         | JWT  | any       | Read one request (Requester: own only; Validator: any).                   |
| PATCH  | `/api/vacation-requests/:id`         | JWT  | Requester | Edit own request (Pending only). Body: `{startDate?, endDate?, reason?}`. |
| POST   | `/api/vacation-requests/:id/cancel`  | JWT  | Requester | Cancel own request (Pending only) — transitions to `Cancelled`.           |
| POST   | `/api/vacation-requests/:id/approve` | JWT  | Validator | Approve a Pending request.                                                |
| POST   | `/api/vacation-requests/:id/reject`  | JWT  | Validator | Reject a Pending request.                                                 |

Sample requests:

```bash
# Login
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Demo123!"}'

# Submit a request (use the token from the login response)
curl -X POST http://127.0.0.1:3000/api/vacation-requests \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"startDate":"2099-07-01","endDate":"2099-07-05","reason":"family trip"}'
```

## Database schema

Two tables, native Postgres enums, UUID primary keys, explicit constraints and indexes.

- `users(id, name, email UNIQUE, password_hash, role enum('Requester','Validator'), created_at, updated_at)`
- `vacation_requests(id, user_id FK→users, start_date, end_date, reason, status enum('Pending','Approved','Rejected','Cancelled') default 'Pending', comments, created_at, updated_at, CHECK end_date >= start_date)`
- Indexes: `(user_id, status)` for overlap detection and "my requests"; `(status, created_at DESC)` for the validator's default sort.

Migrations:

- `Init1715500000000` — creates the two tables, both enums, all constraints and indexes.
- `AddCancelledStatus1715600000000` — extends the `vacation_status` enum with `'Cancelled'` (non-transactional migration, required by Postgres for `ALTER TYPE ADD VALUE`).

## Testing

The backend has comprehensive integration tests against a real test Postgres database.

```bash
docker compose -f docker-compose.test.yml up -d
npm run test:api
```

**56 tests across 5 suites** cover auth flows, requester-side create/overlap/edit/cancel, validator-side filters/pagination/stats, approve/reject transitions, the `Cancelled` status handling (default exclusion + explicit filter + stats exclusion), and pure Zod schema unit tests.

Coverage: ≥95% on the service layer.

Frontend tests are intentionally out of scope — given a fixed time budget, deeper backend coverage where the business logic lives is a stronger signal than thin UI snapshot tests.

## Technical decisions

- **TypeORM (not Sequelize)** — the brief mandates TypeORM. Sequelize is more popular in JS land but the brief was clear.
- **JWT (not a "user switcher")** — real authentication with role gating produces real RBAC behavior and is more representative of production code.
- **UUID primary keys** — non-enumerable, professional, `gen_random_uuid()` is built into Postgres 16.
- **PrimeVue (Aura preset)** — its DataTable handles the validator dashboard's sorting/filtering/pagination natively. Aura provides accessibility scaffolding for free; visual styling is then overridden via the pass-through (`pt`) API. Distinctive type pairing was a conscious choice over PrimeVue Aura defaults to differentiate the visual presentation.
- **No Tailwind, no Bootstrap** — both add a separate styling vocabulary that doesn't earn its keep in a focused app. Layout tokens live in `_tokens.scss` and component styles are scoped SCSS inside SFCs.
- **POST sub-resources for approve/reject** (`/:id/approve`, `/:id/reject`) — clearer intent than `PATCH /:id` with a `status` field; per-action authorisation and idempotency rules are explicit.
- **DB-level CHECK constraint on dates** — bad data states are unrepresentable in the database, not just rejected at the API.
- **Postgres native enums** — type safety at the DB level for the two fixed-value columns.
- **Same Zod schemas client and server** — `packages/shared` is source-only and consumed by both via TS path aliases; validation cannot drift between sides.
- **`comments` field interpretation** — the brief contains a small ambiguity: the Validator Interface section says "comment required when rejecting" while the API section says "with optional comments". I interpreted the API wording as authoritative (the column is nullable; the API accepts requests with or without `comments`) and the UI section as a UX workflow rule (the reject modal requires the field client-side). This keeps each layer focused on what it should describe: the DB describes data, the API describes the wire contract, the UI enforces user workflow.

## Visual design notes

Type pairing: DM Serif Display (display) + Manrope (body) — a refined editorial pairing
that signals "thoughtful internal tool" rather than generic admin dashboard. Palette:
deep ink on cool snowpack with a single confident blue accent, plus muted period tones
for status (ochre / forest green / brick red) so the alerts don't overwhelm the data.
All component styling overrides PrimeVue Aura via the pass-through (pt) API to keep
Aura's accessibility scaffolding while replacing its visual language.

## Known limitations

- No password reset, email verification, or refresh tokens (24h JWT, then re-login).
- No notifications (email or in-app) when a decision is made.
- Frontend tests deliberately out of scope.
- Pagination is server-side but rows are not virtualised; fine up to a few thousand rows.
- The validator's default list excludes `Cancelled`; they can opt in via the status filter.

## Future enhancements

- Audit trail (`decided_by`, `decided_at`) surfaced to requesters.
- Calendar view of approved vacations across the team.
- Email notifications on decision.
- Multi-tenant org partitioning.
