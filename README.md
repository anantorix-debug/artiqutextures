# Wall Texture & Decorative Surface CRM

Enterprise CRM & Quotation Management System covering the full business workflow:

**Lead → Site Visit → Quotation → Project Work Tracking → Follow-up → WhatsApp Communication → Gallery Management**

Two projects, two responsibilities:

| Project | Path | Stack |
|---|---|---|
| Backend API | `wall-texture-crm-api/` | NestJS, Prisma, MySQL, Redis/BullMQ, whatsapp-web.js, Swagger |
| Frontend | `wall-texture-crm/` | Next.js (App Router), TypeScript, Tailwind, shadcn/ui, TanStack Query, React Hook Form + Zod, Recharts |

WhatsApp integration (whatsapp-web.js) runs **in-process inside the backend**, not as a separate service — a
BullMQ queue decouples outgoing sends from the request/response cycle so the API never blocks on WhatsApp delivery.

## Architecture at a glance

```
Lead (Customer) ──▶ Site Visit / Follow-up (CustomerActivity timeline)
      │
      ▼
  Quotation (2 PDF templates: Time For Texture / Artique Surface)
      │  approve
      ▼
  Project Tracking (before/progress/after photos, status, % complete)
      │
      ▼
  WhatsApp (send quotation PDF / gallery images, queued via BullMQ)

Gallery ── independent module, categorized, reusable for a future public website
Settings ── WhatsApp / SMTP / General key-value config, audit log, DB backup
Dashboard / Analytics ── cross-cutting read views over all of the above
```

Backend module boundaries mirror this: `customer/`, `quotation/`, `tracking/`, `whatsapp/`, `gallery/`,
`dashboard/`, `analytics/`, `settings/`, `notifications/`, `auth/`, with `common/`, `shared/`, `config/`,
`prisma/` as cross-cutting infrastructure. Frontend mirrors it with `modules/<domain>/`, `services/<domain>.service.ts`,
`hooks/use-<domain>.ts` per feature, on top of shared `components/ui` (shadcn) and `components/shared` primitives
(DataTable, StatCard, ConfirmDialog, PageHeader).

This module boundary is what makes the codebase future-ready: adding Inventory, Invoicing, Material Management,
a Customer Portal, a public Website CMS, or a mobile app means adding new modules alongside the existing ones —
none of the existing modules need to change shape to accommodate them.

## Prerequisites

- Node.js 22+
- MySQL running locally (this project was built against **XAMPP MySQL** — `http://localhost/phpmyadmin`)
- Redis (for BullMQ) — either installed locally or run via `docker compose up redis`

## Database

```
Host:     localhost
Port:     3306
User:     root
Password: (empty)
Database: walltextures
```

Create the database once (phpMyAdmin → New, or `mysql -u root -e "CREATE DATABASE walltextures"`), then run
migrations from `wall-texture-crm-api/`.

## First-time setup

```bash
# 1. Backend
cd wall-texture-crm-api
npm install
npx prisma migrate dev      # creates all tables in `walltextures`
npx prisma db seed          # admin user + quotation templates + gallery categories
npm run start:dev           # http://localhost:3001/api  (Swagger at http://localhost:3001/api)

# 2. Frontend (separate terminal)
cd wall-texture-crm
npm install
npm run dev                 # http://localhost:3000
```

Seeded login: `admin@walltextures.com` / `Admin@123` — change the password after first login
(or override via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars before seeding).

Both `.env` (backend) and `.env.local` (frontend) are pre-filled with local defaults — nothing is hardcoded in
source, only in these gitignored env files.

## WhatsApp connection

1. Open **Settings → WhatsApp** (or the WhatsApp page) in the frontend.
2. Click **Connect WhatsApp** — the backend launches a headless Chrome session via whatsapp-web.js.
3. Scan the QR code shown with WhatsApp → **Linked Devices → Link a Device**.
4. The session persists to `wall-texture-crm-api/whatsapp-sessions/` so you don't need to re-scan on every restart.

Only one WhatsApp account is supported at a time, per spec.

## Running with Docker

```bash
docker compose up --build
```

This starts exactly two application containers plus Redis:

- `backend` — NestJS API (port 3001), Chrome baked into the image for whatsapp-web.js
- `frontend` — Next.js standalone build (port 3000)
- `redis` — BullMQ queue backing

**MySQL is intentionally not containerized** — the backend connects to MySQL running on the host machine via
`host.docker.internal`, the same pattern used in the reference A2 Insurance deployment. This means:

- Your local XAMPP MySQL must be reachable from Docker's network. On Windows/Mac, Docker Desktop resolves
  `host.docker.internal` automatically. If MySQL's `bind-address` is locked to `127.0.0.1` only, or the `root`
  user is restricted to `'localhost'`, you'll need to relax one of those for the container to connect —
  check `phpMyAdmin → User accounts` for the host column on `root`.
- Migrations are **not** run automatically on container start (deliberately, to avoid surprise schema changes
  on every restart). After the first `docker compose up`, run once:
  ```bash
  docker exec wtc-backend npx prisma migrate deploy
  docker exec wtc-backend npx prisma db seed
  ```
- WhatsApp session, uploaded files, and DB backups persist via named Docker volumes
  (`backend-whatsapp-sessions`, `backend-uploads`, `backend-backups`), so they survive container rebuilds.

Environment variables for the containerized backend live in `wall-texture-crm-api/.env.docker` (loaded via
`env_file` in `docker-compose.yml`) — separate from the local-dev `.env` so the two never conflict.

## Verified end-to-end

During development this session verified, against the real database and a real running server (not mocks):

- Full auth flow (login, JWT issuance, protected routes returning 401 without a token)
- Lead creation with automatic timeline activity logging
- Quotation creation with server-side total calculation (subtotal, discount, GST, transportation/installation/
  additional charges, grand total)
- PDF generation for **both** quotation templates (Time For Texture, Artique Surface) — real PDF bytes produced
- Dashboard KPI aggregation reflecting live data
- Prisma seed producing the admin user, both quotation templates, and all 9 gallery categories
- Full frontend production build (`next build`) — all 17 routes compile and prerender successfully
- Full TypeScript strict-mode check passing on both projects with zero errors

Not verified in this session (couldn't be, in this environment): live WhatsApp QR pairing end-to-end (Chrome
launches and generates a real QR code — confirmed — but pairing requires a physical phone), and a live
`docker compose build` (Docker Desktop's engine was not running here, so the Dockerfiles are carefully written
against the same pattern as the working A2 Insurance deployment but not build-tested in this session). Run
`docker compose build` yourself before relying on it in production.

## API documentation

Swagger UI: `http://localhost:3001/api` (same path as the API prefix — Swagger is mounted independently of it).

## Project structure

```
wall-texture-crm-api/
  src/
    auth/ customer/ quotation/ tracking/ gallery/ whatsapp/
    dashboard/ analytics/ settings/ notifications/
    common/      # filters, interceptors, decorators, pagination DTO
    shared/      # PDF/Excel/Mailer/AuditLog services, file storage
    config/      # typed configuration from env
    prisma/      # PrismaService (global module)
  prisma/
    schema.prisma   # 22 tables, UUID PKs, soft delete, audit columns
    seed.ts

wall-texture-crm/
  app/
    (auth)/login, forgot-password, reset-password
    (dashboard)/dashboard, leads, quotations, tracking, gallery, whatsapp, analytics, settings
  modules/         # feature components, one folder per domain
  services/        # typed axios wrappers per domain
  hooks/           # TanStack Query hooks per domain
  components/
    ui/            # shadcn primitives (Base UI powered)
    shared/         # DataTable, StatCard, PageHeader, ConfirmDialog, StatusBadge
    layout/          # Sidebar, Topbar, AuthGuard
  store/            # zustand (auth, ui)
  lib/              # api-client (axios + refresh interceptor), format, chart-colors
  types/            # entities + enums mirrored from the Prisma schema
```
