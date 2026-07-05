# Tract — Contract Operations Console

A multi-tenant contract management console: organizations, contract JSON upload with validation, a DRAFT → FINALIZED → ARCHIVED status workflow with a full audit trail, org-scoped search/filter/pagination, and live status updates across browser tabs via Server-Sent Events (SSE).

## Architecture

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, antd (used sparingly — inputs/buttons/toasts only), Redux Toolkit.
- **Backend**: Express 5 (ESM), Prisma 7 (`prisma-client-js` generator) with the `@prisma/adapter-pg` driver adapter.
- **Database**: PostgreSQL (hosted on Supabase).
- **Auth**: Supabase Auth (email/password). The backend verifies tokens by calling `supabase.auth.getUser(token)` — no local JWT secret handling.
- **Real-time**: Server-Sent Events, one in-memory per-organization broadcaster (single Node process — no external pub-sub needed at this scale).

## Setup

### Prerequisites

- Node.js 22+
- A Supabase project (Project URL, anon/publishable key, and its Postgres connection string — Settings → Database → Connection string)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in the values below
npx prisma migrate dev
npm run build            
npm run dev              # starts on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                   # starts on http://localhost:3000
```

### Seeding data into your own account

`npm run seed` (in `backend/`) creates 2 organizations and 5 contracts (spread across DRAFT/FINALIZED/ARCHIVED), but by default attaches them to a placeholder user id so you won't see them until you point the seed at your real account:

1. Sign up through the app UI once (`/signup`).
2. Sign in, then call `GET /api/me` with your session's access token (e.g. from the browser console: `(await supabase.auth.getSession()).data.session.access_token`) to get your Supabase user id.
3. Set `SEED_USER_ID=<that id>` in `backend/.env`.
4. Re-run `npm run seed` — the 2 organizations and 5 contracts will now show up under your account.

The seed script is idempotent (organizations are upserted by slug), so re-running it is safe.

## Environment variables

### `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default `3001`) |
| `DATABASE_URL` | Supabase Postgres — **pooled** connection (PgBouncer, port `6543`, `?pgbouncer=true`), used by the Prisma runtime client via the `pg` driver adapter |
| `DIRECT_URL` | Supabase Postgres — **direct** connection (port `5432`), used only by Prisma Migrate/introspection |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon/publishable key (used server-side to call `supabase.auth.getUser()`) |


### `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/publishable key |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (e.g. `http://localhost:3001`). Also used to build the SSE stream URL — no separate SSE env var is needed. |
|NEXT_PUBLIC_ENVIRONMENT=DEVELOPMENT

## Contracts feature notes

**Required contract JSON shape:**

```json
{
  "client_name": "string (required)",
  "po_ref_no": "string (required)",
  "po_date": "YYYY-MM-DD (required)",
  "payment_terms": "string (optional)",
  "delivery_terms": "string (optional)",
  "items": [
    {
      "description": "string (required)",
      "quantity": "number > 0 (required)",
      "quantity_unit": "string (optional)",
      "unit_price": "number >= 0 (required)",
      "pricing_unit": "string (optional)",
      "total": "number (optional — auto-computed as quantity × unit_price if omitted)"
    }
  ]
}
```

**Status workflow**: `DRAFT → FINALIZED → ARCHIVED`, one-directional only. Any other transition (re-finalizing, archiving a draft directly, etc.) is rejected with `409`. Only `DRAFT` contracts can be edited or deleted.

**Real-time**: finalizing/archiving a contract broadcasts an SSE event to every open tab/session viewing contracts in that organization — the contract detail page updates its status badge live without a reload.

**Deployed URL**: _TBD — to be filled in after deployment._
