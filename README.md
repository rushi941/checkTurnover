# TurnOverCheck

Multi-business SaaS for kirana & general retail — daily purchases, **Vakro** (daily sales total), payment tracking (paid/pending per store), and reports.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, **shadcn/ui**, Tailwind |
| Data fetching | **TanStack Query** |
| Tables | **TanStack Table** |
| Backend | Node.js, Express 5, TypeScript |
| Database | **PostgreSQL** (raw SQL via `pg` — **no Prisma**) |
| Auth | JWT + RBAC |

## Quick start

### Prerequisites

- Node.js 20+
- **Local PostgreSQL** (pgAdmin) — no Docker required

### Setup

```bash
npm install

# Create tables + sample test data (uses local PostgreSQL from .env)
npm run db:setup

npm run dev
```

Default database connection in `.env`:

```
postgresql://postgres:Admin@123@localhost:5432/turnover_check
```

(Password `@` is URL-encoded as `%40` in the connection string.)

Or create database manually in pgAdmin named `turnover_check`, then run `npm run db:migrate` and `npm run db:seed`.

- **Web:** http://localhost:5173  
- **API:** http://localhost:4000/api/v1/health  

### Test accounts (after `npm run db:seed`)

Default credentials (override in `.env` with `SEED_*` vars):

| Role | Email | Password |
|------|-------|----------|
| Shop | rajesh@shreeganeshkirana.com | Turnover@2026 |
| Admin | rushisheth941@gmail.com | Admin@123 |

The seed loads **30 days** of realistic purchases, vakro, payments, and a **15 Lakh** monthly target for the shop **Shree Ganesh Kirana & General Store**. Legacy demo accounts are removed automatically.

## Project structure

```
apps/
  api/          Express API, pg pool, SQL migrations
  web/          React + shadcn + TanStack
packages/
  shared/       Shared TypeScript types
docs/           Requirements, architecture, AI roadmap
```

## Shop app pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Today purchases, pending, Vakro, profit |
| Purchases | `/purchases` | Totals, paid/pending, record payments by store |
| Vakro | `/vakro` | Enter tonight's total sales |
| Reports | `/reports` | Monthly breakdown |
| Invoices | `/invoices` | GST PDF (next sprint) |
| AI Insights | `/ai` | Reserved for future AI |

## AI (future)

See [docs/AI-ROADMAP.md](docs/AI-ROADMAP.md). API stub at `GET /shops/:id/ai/insights`. Share your AI plan when ready.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + Web concurrently |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed` | Test admin + shop with 30 days sample data |
| `npm run build` | Build all packages |

## Environment

Copy [.env.example](.env.example) to `.env`. Key vars:

- `DATABASE_URL` — local PostgreSQL (default: `postgres` / port `5432`)
- `JWT_SECRET` — auth signing key
- `CORS_ORIGIN` — frontend URL

## Cursor agent skills

See [.cursor/AGENTS.md](.cursor/AGENTS.md) for architect, developer, QA, and review workflows.
