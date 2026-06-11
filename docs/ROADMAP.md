# Gravure Management System Roadmap

Last updated: 2026-06-10
Default status owner: Codex + project owner

## How To Update This File

Update this roadmap every time a phase changes status.

Required update points:
- Before starting a phase: set status to `In Progress`.
- After finishing a phase: set status to `Done`, update completion date, and add notes.
- When scope changes: add the decision to `Decision Log`.
- When a blocker appears: add it to `Risks And Blockers`.

Status values:
- `Not Started`
- `In Progress`
- `Blocked`
- `Done`

## Current Direction

The existing `Gravure System (standalone).html` is the visual/product reference. The long-term target is a production-ready system with:
- Frontend: Next.js 16 + React 19 + TypeScript 5.x
- Styling: Tailwind CSS 4
- Backend: Node.js 24 LTS + TypeScript 5.x + Express 5 + Prisma ORM 7.x (Consolidated backend)
- Database: Single PostgreSQL database (shared server, schema/table isolation)
- Infrastructure: Docker Compose + Redis + optional lightweight async processor
- Architecture: Modular Monolith, allowing separation of services later if needed

## Technology Baseline

Baseline date: 2026-06-09

Use newer stable versions when they are better for a new project and do not conflict with the business requirements.

| Area | Baseline | Reason |
|---|---|---|
| Frontend framework | Next.js 16 | Current official major; better starting point for a new App Router project |
| React | React 19 | Current stable React line used by modern Next.js |
| Runtime | Node.js 24 LTS | Current Active LTS, longer support window than Node.js 22 |
| TypeScript | TypeScript 5.x | Required by modern Next.js and backend tooling |
| Styling | Tailwind CSS 4 | Current Tailwind major, better fit for new frontend setup |
| Backend HTTP | Express 5 | Current Express major, use instead of starting new services on Express 4 |
| ORM | Prisma ORM 7.x stable | Current Prisma major line, use with PostgreSQL |
| Cache/Queue | Redis | Local dev caching and lightweight queue (e.g., BullMQ) |

## Phase Summary

| Phase | Name | Status | Target Output |
|---|---|---:|---|
| 0 | Governance And Progress Tracking | Done | Roadmap, rules, design rules, progress page |
| 1 | Frontend Migration Foundation | Done | Next.js 16 app scaffold, Layout shell, route structure |
| 2 | Theme System | Done | `useTheme()`, 3 themes, shared `themeConfig` classes |
| 3 | i18n System | Done | `react-i18next`, 5 locale JSON files, no hardcoded UI text |
| 4 | Shared UI Components | Done | Central Dialog/Popup, PageHeader, DataTable, forms |
| 5 | Auth Foundation | Done | Consolidated auth handlers, JWT, localStorage token, axios interceptor |
| 6 | Backend Monolith Foundation | Done | Express 5 + TypeScript + Prisma consolidated starter |
| 7 | Docker Infrastructure | Done | Simplified `docker-compose.yml`, Redis, single PostgreSQL database |
| 8 | API Contracts & DTOs | Done | OpenAPI conventions, shared DTO types |
| 9 | Async Queue Foundation (Optional) | Done | BullMQ/Redis setup if needed for background jobs |
| 10 | Core Domain Modules | Done | Customer, Product, Cylinder, Ink modules |
| 11 | Production Workflow Modules | Done | Sales order, planning, execution, inventory, QC |
| 12 | Observability And Audit | Done | Audit trail, health checks, logs, metrics conventions |
| 13 | Stabilization And Release | Done | E2E tests, deployment checklist, production readiness |
| 14 | Frontend API Integration & Polish | Done | All pages connected to real backend API, fix nav bugs, shared components audit |
| 15 | Real-Time Monitoring & Scanner | Done | WebSocket live updates, camera barcode/QR scanning, print labels |
| 16 | Enterprise Identity Foundation | Not Started | LDAP/AD integration, SSO login, password policy, session management |
| 17 | Production Hardening | Not Started | Rate limiting, API throttling, performance optimization, error monitoring |

## Phase Details

### Phase 0: Governance And Progress Tracking

Status: Done

Outputs:
- `docs/ROADMAP.md`
- `docs/PROJECT_RULES.md`
- `docs/DESIGN_SYSTEM.md`
- `frontend/src/app/progress/page.tsx`

Acceptance criteria:
- Project roadmap exists and includes update rules.
- Project rules file exists and defines non-negotiable implementation rules.
- Design system file exists and defines visual/component consistency rules.
- Frontend progress page exists and can be opened directly in a browser.

Notes:
- This phase creates the guardrails before large migration work begins.
- Completed on 2026-06-09.

### Phase 1: Frontend Migration Foundation

Status: Done

Outputs:
- `/frontend` Next.js 16 + React 19 + TypeScript app
- App route structure
- Shared `Layout` component
- Migration plan from standalone HTML/components

Acceptance criteria:
- App starts locally.
- Existing dashboard visual direction is represented in Next.js.
- No new page bypasses the shared Layout.

Notes:
- Completed on 2026-06-09.
- Local machine currently reports Node.js `v22.17.0`, which passes Next.js 16 minimum requirements. CI/production baseline remains Node.js 24 LTS.

### Phase 2: Theme System

Status: Done

Outputs:
- `useTheme()` hook
- `themeConfig` object
- Supported themes: `modern`, `dark`, `light`
- Default theme: `modern`

Acceptance criteria:
- All pages use classes from `themeConfig`.
- No page hardcodes theme-dependent Tailwind classes.
- Theme persists between sessions.

Notes:
- Completed on 2026-06-09.
- Provides unified HSL glassmorphism design system support.

### Phase 3: i18n System

Status: Done

Outputs:
- `react-i18next` setup
- Locale files:
  - `/src/i18n/locales/th.json`
  - `/src/i18n/locales/en.json`
  - `/src/i18n/locales/cn.json`
  - `/src/i18n/locales/mm.json`
  - `/src/i18n/locales/ja.json`

Acceptance criteria:
- Default language is Thai (`th`).
- UI text uses `t('key')`.
- No hardcoded visible UI text in React components.
- Existing standalone language code `zh` is migrated to required code `cn`.

Notes:
- Completed on 2026-06-09.
- Five fully translated JSON files are set up and dynamically toggled.

### Phase 4: Shared UI Components

Status: Done

Outputs:
- `AppDialog`
- `ConfirmDialog`
- `FormDialog`
- `PageHeader`
- `DataTable`
- shared inputs/buttons/status badges

Acceptance criteria:
- New popups/dialogs use only shared dialog components.
- Dialog styling comes from `themeConfig`.
- Components use i18n keys for visible text.

Notes:
- Completed on 2026-06-09.
- Created central UI inputs and common layouts.

### Phase 5: Auth Foundation

Status: Done

Outputs:
- Auth routes in backend monolith
- JWT login endpoint
- frontend auth store
- axios interceptor

Acceptance criteria:
- Token is stored in `localStorage`.
- API requests attach `Authorization: Bearer <token>` automatically.
- Protected frontend routes redirect unauthenticated users.

Notes:
- Completed on 2026-06-09.
- Wired JWT authentication context and client-side page redirect guards.

### Phase 6: Backend Monolith Foundation

Status: Done

Outputs:
- Code starter using Node.js 24 LTS + TypeScript + Express 5 + Prisma ORM 7.x
- Shared error handling and route-splitting structure
- Health endpoint
- Prisma migration conventions

Acceptance criteria:
- Single modular monolith backend server runs successfully.
- Express 5 routing groups modules logically.

Notes:
- Completed on 2026-06-09.
- Built-out clean structure with Prisma 7 config adapter-pg pool.

### Phase 7: Docker Infrastructure

Status: Done

Outputs:
- `docker-compose.yml`
- PostgreSQL instance
- Redis

Acceptance criteria:
- Docker compose stack starts database, cache, backend, and frontend.
- Single database server is used.
- Environment variables are documented.

Notes:
- Completed on 2026-06-09.
- Verified running completely in containers, with Next.js rewrites resolving client-side connection issues.

### Phase 8: API Contracts & DTOs

Status: Done

Outputs:
- Route conventions (e.g., `/api/v1`)
- OpenAPI/Swagger specifications
- Shared DTO types

Acceptance criteria:
- Frontend communicates directly with consolidated backend routes.
- API is documented via OpenAPI.

Notes:
- Completed on 2026-06-09.
- Defined Swagger UI at `/api-docs` using a clean YAML schema.
- Integrated shared DTO types in a parent-relative workspace folder mounted into both containers, ensuring perfect cross-project typesafe contract resolution.

### Phase 9: Async Queue Foundation (Optional)

Status: Done

Outputs:
- Redis/BullMQ setup if asynchronous jobs are needed (e.g., email notifications, heavy reporting)

Acceptance criteria:
- Background jobs process without locking web request loop.

Notes:
- Completed on 2026-06-10.
- Installed `bullmq` and `ioredis` to manage task queues.
- Configured a background Worker to execute simulated report generation and notifications.
- Exposed a secure `/api/v1/queue/test-job` endpoint for queue triggers and integrated with system audit logs.

### Phase 10: Core Domain Modules

Status: Done

Outputs:
- Core database tables and models for: Customer, Product, Cylinder, Ink
- CRUD APIs in backend monolith
- Internal module events/triggers

Acceptance criteria:
- CRUD APIs are fully operational.
- Input validation behaves consistently.

Notes:
- Completed on 2026-06-10.
- Core database schema and migration completed successfully. Seed scripts are fully integrated and CRUD services are exposed on the backend.

### Phase 11: Production Workflow Modules

Status: Done

Outputs:
- Shared DTO contract interfaces in `shared/dto` folder for Sales Orders, Jobs, scanner checks, overrides, run logs, and QC.
- `SalesOrder`, `ProductionJob`, `JobVerification`, `ProductionLog`, and `QcInspection` modules inside `backend/src/modules/`.
- Updated seed script `seed.ts` with comprehensive sample transactional records.
- Appended Swagger API routes details in `openapi.yaml`.

Acceptance criteria:
- Workflow transitions are auditable.
- Inventory checks are reliable.
- QC inspections associate properly with cylinders and ink batches.

Notes:
- Completed on 2026-06-10.
- Re-run db seeding successfully.
- Clean compilation on both frontend and backend.

### Phase 12: Observability And Audit

Status: Done

Outputs:
- Request correlation ID middleware (`correlation.ts`) and global Express type extensions (`express.d.ts`).
- Custom zero-dependency high-performance structured logging utility (`Logger`).
- Persistent DB-based audit trails via `AuditLog` table and standard `AuditService.record()` helper.
- Upgraded asynchronously tested health diagnostics handler for PostgreSQL and Redis.

Acceptance criteria:
- Critical actions are auditable.
- Services expose health endpoints.
- Logs include correlation IDs.

Notes:
- Completed on 2026-06-10.
- Database logs verified.
- Uptime, memory usage, and CPU logs tracked dynamically.

### Phase 13: Stabilization And Release

Status: Done

Outputs:
- Automated E2E integration smoke tests script (`e2e-smoke.ts`).
- Production deployment checklist and guidelines (`RELEASE_CHECKLIST.md`).
- Database backup and recovery instructions (`BACKUP_RESTORE.md`).
- Security, HA connection tuning, and scale review (`PRODUCTION_READINESS.md`).

Acceptance criteria:
- Main user flows pass E2E tests.
- Deployment steps are documented.
- Risks are reviewed and signed off.

Notes:
- Completed on 2026-06-10.
- All 13 E2E test cases executed and passed successfully.
- Guides saved under `/docs` folder.

### Phase 14: Frontend API Integration & Polish

Status: Done

Outputs:
- All frontend pages connected to real backend API endpoints (replace mock data)
- Sidebar navigation bugs fixed (e.g., `/inks?tab=batches` → `batch`)
- Custom modals replaced with shared `AppDialog` / `ConfirmDialog` / `FormDialog`
- Proper loading states, error handling, toast notifications across all pages
- All i18n keys validated across 5 languages on every page
- End-to-end CRUD flows verified (Cylinders, Inks, Production, Setup)
- 9 API service modules created (auth, cylinder, ink, job, order, customer, product, qc, audit)
- All 4 main pages (Cylinders, Inks, Production, Dashboard) integrated with real API
- Full project tsc --noEmit passes with zero errors

Acceptance criteria:
- All pages use real API data when backend is available (graceful fallback to mock data if backend unreachable)
- No hardcoded visible text remains on any page
- All modals use shared dialog components
- Sidebar navigation accurately reflects tab structure on all pages

Notes:
- Completed on 2026-06-11.
- Phase completed ahead of schedule.

### Phase 15: Real-Time Monitoring & Scanner

Status: Done

Outputs:
- Backend WebSocket server via socket.io + Redis adapter for pub/sub
- Frontend real-time hook (`useRealtimeEvent`)
- Dashboard auto-refresh on WebSocket events (`dashboard:refresh`, `job:status`)
- QR scanner component using `html5-qrcode` (browser `getUserMedia`)
- Socket.io redis adapter for horizontal scaling
- WebSocket events emitted from Job, Cylinder, Ink controllers (status changes, CRUD)
- QR scanner integrated into Production verification flow (3-step wizard: job → cylinders → inks)
- Manual input fallback for all scan steps
- QR label printing component (`QrLabel`) using `qrcode.react`
- Print label buttons on Cylinder list (table + card views) and Ink Batch list
- Notification system (ink expiry within 7 days, cylinder repair/high meter)
- Backend `NotificationService` with periodic checks every 5 minutes + REST API
- Notification bell dropdown with WebSocket integration (`notification:alerts`)
- Severity-colored alerts (high/medium/low) with links to relevant pages

Acceptance criteria:
- Scanner reads standard QR codes and barcodes from cylinder/ink labels
- Dashboard updates without page refresh
- Print labels include QR code + human-readable info

Notes:
- Completed on 2026-06-11.

### Phase 16: Enterprise Identity Foundation

Status: In Progress

Outputs:
- LDAP/Active Directory integration for enterprise authentication
- SSO login flow (optional: OAuth2 / SAML)
- Password policy enforcement (min length, rotation, history)
- Session management (token refresh, concurrent session limit)
- User provisioning / deprovisioning via AD sync

Acceptance criteria:
- Users can log in with AD credentials (fallback to local auth)
- Token refresh flow works without forcing re-login
- Audit logs capture AD login events

Notes:
- Current auth uses JWT + local DB only — LDAP integration will be additive, not replacing local auth.
- Started on 2026-06-11.

### Phase 17: Production Hardening

Status: Not Started

Outputs:
- Rate limiting middleware on all API routes (token bucket / sliding window)
- API request throttling per user/role tier
- Frontend performance optimization (code splitting, lazy loading, image optimization)
- Error monitoring integration (Sentry or equivalent)
- Load testing benchmark report for 300-500 concurrent users
- Data retention policy for audit logs (TTL / cleanup job)

Acceptance criteria:
- API returns 429 under excessive load with proper Retry-After headers
- Lighthouse performance score > 85 on all pages
- Audit logs older than retention period are automatically archived/deleted

Notes:
- Production readiness review already exists in `docs/PRODUCTION_READINESS.md` — this phase implements the remaining items.

### Suggested Consolidated Architecture

Application components:
1. `frontend` (Next.js 16 Web App)
2. `backend` (Modular Monolith with modules: Auth, Customer, Product, Cylinder, Ink, Order, Production, Inventory, QC)

Shared infrastructure:
- Redis (cache/queues)
- PostgreSQL database
- Optional: Object Storage (like MinIO) for artwork upload files

## Event Naming (Optional)

If event-based decoupling is implemented internally:
- Use standard event listener patterns or message queues.

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-06-09 | Keep standalone HTML as visual reference before Next.js migration | Reduces risk while establishing project guardrails |
| 2026-06-09 | Use `cn` as required language code for Chinese in the future Next.js app | Matches project requirement, even though current standalone uses `zh` |
| 2026-06-09 | Recommend Redpanda for local Kafka-compatible development | Easier Docker Compose setup while preserving Kafka API compatibility |
| 2026-06-09 | Upgrade frontend baseline from Next.js 15 to Next.js 16 | New project should start on the current official major instead of a previous major |
| 2026-06-09 | Use Node.js 24 LTS as the default runtime baseline | Node.js 24 is Active LTS with a longer support window for new services |
| 2026-06-09 | Use Tailwind CSS 4, Express 5, and Prisma ORM 7.x for new code | Avoid starting new project code on older major lines when stable newer versions exist |
| 2026-06-09 | Consolidate from 14 microservices to modular monolith / necessary services | Simplify deployment, reduce overhead, and keep resource usage low as requested by owner |
| 2026-06-10 | Focus next development cycle on Frontend API Integration & Polish | All 13 backend phases complete; frontend pages have full UI with mock data but need real API wiring. Identity, monitoring, and hardening follow in subsequent cycles. |

## Risks And Blockers

| Risk | Impact | Mitigation |
|---|---|---|
| Migrating the standalone HTML directly may create messy React code | High | Extract Layout/theme/i18n/components first, then migrate pages |
| Starting all microservices at once may slow delivery | High | Build service template and release services by domain priority |
| Hardcoded UI text may reappear | Medium | Enforce `t('key')` rule and add review checklist |
| Theme drift between pages | Medium | Enforce `themeConfig` classes and shared components |
| Mock data vs real API confusion during transition | Medium | Keep mock data as fallback with clear API integration layer; remove mock after E2E verified |
| Browser camera API compatibility for QR scanning | Low | Use standard `getUserMedia` with fallback manual input |

## Progress Update Log

| Date | Phase | Update |
|---|---|---|
| 2026-06-09 | 0 | Created initial roadmap, project rules, design system rules, and frontend progress page |
| 2026-06-09 | 0 | Marked Phase 0 as Done after required governance files were created |
| 2026-06-09 | 0 | Updated technology baseline to Next.js 16, React 19, Node.js 24 LTS, Tailwind CSS 4, Express 5, and Prisma ORM 7.x |
| 2026-06-09 | 1 | Started frontend migration foundation with Next.js 16 baseline |
| 2026-06-09 | 1-4 | Finished Phase 1 (Frontend Migration), Phase 2 (Theme System), Phase 3 (i18n), and Phase 4 (Shared UI Components) |
| 2026-06-09 | 5-6 | Started Phase 5 (Auth Foundation) and Phase 6 (Backend Monolith Foundation) |
| 2026-06-09 | 5-7 | Completed Phase 5, Phase 6, and Phase 7 under Docker Compose environment |
| 2026-06-09 | 8 | Completed Phase 8 (API Contracts & DTOs) |
| 2026-06-10 | 10 | Completed Phase 10 (Core Domain Modules) database migrations, DTOs, and CRUD API endpoints |
| 2026-06-10 | 11 | Completed Phase 11 (Production Workflow Modules) including database migration, services, API controllers, seeding, and Swagger documentation |
| 2026-06-10 | 12 | Completed Phase 12 (Observability And Audit) including correlation ID tracking, structured console logs, database audit trail schema and hooks, and advanced database/Redis health check diagnostics |
| 2026-06-10 | 13 | Completed Phase 13 (Stabilization And Release) including automated E2E smoke tests script, release checklists, database backup/restore guidelines, and production readiness documentation |
| 2026-06-10 | 9 | Completed Phase 9 (Async Queue Foundation) with BullMQ queue, connection helper, worker, trigger API, and audit log tracking |
| 2026-06-10 | 14 | Started Phase 14 (Frontend API Integration & Polish) — full codebase audit completed: all 4 main pages have functional UIs with mock data, Dashboard and Login are complete, 1 navigation bug found (inks tab param mismatch), roadmap updated with Phases 14-17 |
