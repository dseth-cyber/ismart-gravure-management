# iSmart Gravure Management System

ERP system for managing gravure cylinders, ink formulations, and production workflows in a printing factory.

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **Backend:** Express 5 + Prisma 7 (Modular Monolith)
- **Database:** PostgreSQL 18
- **Cache/Queue:** Redis 8 + BullMQ
- **Infrastructure:** Docker Compose

## Features

- **Dashboard** — Real-time overview of cylinders, inks, and production
- **Cylinder Management** — Tracking, status, location, usage history
- **Ink Management** — Standard formulas, batch management, FEFO, shade adjustment
- **Production** — Pre-print verification, production logging, traceability
- **RBAC** — 8 roles (admin, sales, planner, production, qc, warehouse, inkroom, viewer)
- **i18n** — 5 languages: Thai, English, Chinese, Burmese, Japanese
- **Themes** — Modern, Dark, Light

## Quick Start

```bash
# Start all services
docker compose up -d --build

# Apply database migrations
docker compose exec backend npx prisma migrate deploy

# Seed initial data (admin user + demo data)
docker compose exec backend npx prisma db seed
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Docs:** http://localhost:5000/api-docs

## Default Login

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |

## Architecture

```
ismart-gravure-management/
├── frontend/          # Next.js 16 SPA (CSR)
│   └── src/
│       ├── app/           # Pages (cylinders, inks, production, setup, login)
│       ├── components/    # Shared UI (layout, table, dialog, badge, etc.)
│       └── lib/           # API client, auth, i18n (5 locales), theme (3 themes)
├── backend/           # Express 5 Modular Monolith
│   └── src/
│       ├── modules/       # 10 domain modules (auth, cylinder, ink, job, order, ...)
│       ├── middleware/    # Auth, error, logger, correlation
│       └── config/       # Database, env
├── shared/            # Shared DTOs (TypeScript types)
├── docs/              # Design system, roadmap, project rules
└── docker-compose.yml # PostgreSQL + Redis + Backend + Frontend
```

## Development

```bash
# Backend dev (with hot reload)
docker compose logs -f backend

# Frontend dev (with hot reload)
docker compose logs -f frontend

# Run smoke tests
docker compose exec backend npm run test:smoke
```

## License

Private — internal use only.
