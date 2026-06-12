# Gravure Management System Roadmap

Last updated: 2026-06-12
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
| 16 | Enterprise Identity Foundation | Done | LDAP/AD integration, SSO login, password policy, session management |
| 17 | Production Hardening | Done | Rate limiting, API throttling, performance optimization, error monitoring |
| 18 | Security & Identity | Done | MFA (TOTP), Enhanced LDAP, Docker Secrets |
| 19 | Operations & Observability | Done | Backup automation, Enhanced health monitoring |
| 20 | Advanced RBAC & Workflow | Done | Fine-grained permissions, Approval workflow engine |
| 21 | Integration & Storage | Done | Notification gateway, MinIO, SSO foundation |
| 22 | Database Schema Isolation | Done | Domain-based schemas (auth, inventory, production, sales, workflow, audit) |
| 23 | API Security Hardening | Done | Helmet, CORS whitelist, Zod validation, API keys |
| 24 | Observability Stack | Done | Grafana, Loki, Prometheus, alert rules |
| 25 | Notification Gateway | Done | LINE, Telegram, Email, template engine |
| 26 | File Storage Layer | Done | MinIO, abstraction, thumbnails, file picker |
| 27 | AI Gateway & IoT | Done | Multi-provider AI, MQTT bridge, device registry |
| 28 | Production Deploy & DR | Done | Cloudflare Tunnel, DR plan, load testing, security audit |
| 29 | Permission Management | Done | Seed permissions, Role-Permission mapping, Permission UI, PermissionProvider wiring |

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

Status: Done

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
- Completed on 2026-06-11.
- Token refresh: 15m access token + 7d refresh token with rotation (old token revoked on refresh).
- Password policy: 8+ chars, uppercase, lowercase, digit, special char required. Last 5 hashes remembered.
- Session limit: max 5 concurrent sessions per user (oldest revoked when limit exceeded).
- Account lockout: 5 failed attempts → 15 min lockout.
- LDAP: fallback auth with ldapjs, first successful LDAP login auto-provisions user.
- Frontend: axios interceptor queues pending requests during token refresh, auto-retries after refresh.

### Phase 17: Production Hardening

Status: Done

Outputs:
- Rate limiting middleware on all API routes (token bucket via Redis)
  - Login: 5 req/min, API: 100 req/min, returns 429 with Retry-After + X-RateLimit-* headers
- Data retention policy (daily cleanup): purge audit logs > 90 days + expired refresh tokens
- Frontend performance: dynamic imports for QrScanner and QrLabel (code splitting, no SSR)
- Image optimization config: AVIF/WebP formats, optimizePackageImports for lucide-react + qrcode.react
- Error monitoring (Sentry): ready to add DSN via SENTRY_DSN env var (not configured)
- Load testing: benchmark-ready with rate limit headers for tuning

Acceptance criteria:
- API returns 429 under excessive load with proper Retry-After headers
- Lighthouse performance score > 85 on all pages (via code splitting + image optimization)
- Audit logs older than retention period are automatically purged daily

Notes:
- Completed on 2026-06-11.
- Rate limiter uses Redis for distributed counting — no single-node bottleneck.
- Retention period: 90 days (configurable via AUDIT_LOG_RETENTION_DAYS env var).
- Cleanup runs every 24 hours on server startup interval.

### Phase 18: Security & Identity Hardening

Status: Done

Outputs:
- Multi-Factor Authentication (MFA) with TOTP (Microsoft/Google Authenticator)
  - SUPERADMIN and ADMIN roles require MFA; optional for others
  - QR code setup flow with verification step
  - MFA challenge on login after password verification
  - Ability to disable MFA with current TOTP verification
- Enhanced AD/LDAP with group-to-role mapping
  - LDAP group membership query via memberOf attribute
  - Configurable role mapping (e.g. `ERP_ADMIN` → `admin`)
  - Auto-provision users on first LDAP login with mapped role
  - AD disable sync (check user accountControl on each login)
- Secret Management via Docker Secrets
  - JWT secrets, DB credentials moved to Docker secrets
  - Fallback to .env for development
  - Secrets loaded at startup, not stored in env vars

Acceptance criteria:
- Users can enable/disable MFA on their profile
- Login requires TOTP code when MFA is enabled (SUPERADMIN/ADMIN enforced)
- LDAP users mapped to correct roles based on AD group membership
- Disabled AD accounts cannot log in
- No secrets exposed in docker-compose.yml or .env in production

Notes:
- TOTP implemented with Node.js crypto (RFC 6238), no external deps
- 8 backup codes with SHA-256 hashed storage
- 3-window time drift tolerance (±30s)
- MFA temp token valid for 5 minutes, single-use
- LDAP group mapping configurable via LDAP_ROLE_MAP env var (JSON)
- Docker secrets file-based (`/run/secrets/*`), works in non-swarm mode via Compose v2+

### Phase 19: Operations & Observability

Status: Done

Outputs:
- Automated Backup Script
  - Daily, weekly, monthly rotation
  - Docker-friendly (executes pg_dump via Docker)
  - Auto-cleanup of backups older than retention period
  - Configurable backup directory and retention
- Enhanced Monitoring Endpoint
  - Disk usage stats for mounted volumes
  - Container status reporting (via Docker socket or env vars)
  - Uptime and resource trend (5-min window averages in Redis)
- Centralized Logging Preparation
  - Structured JSON log format for log aggregator ingestion
  - Correlation ID propagated through all log entries
  - Log level configuration (debug/info/warn/error)

Acceptance criteria:
- `scripts/backup.ps1` creates timestamped dump with rotation
- Backup retention: 7 daily, 4 weekly, 3 monthly
- `GET /health` returns disk usage, container status
- All logs output as JSON when LOG_FORMAT=json

Notes:
- Backup script on Windows PowerShell, uses Docker exec + cp
- Retention cleanup runs after each backup
- Health endpoint returns DB, Redis, disk, memory, container status
- `scripts/monitor.ps1` provides alert-ready health checks with webhook support

### Phase 20: Authorization & Permission System

Status: Done

Outputs:
- Fine-Grained Permission Model
  - `Permission` entity with resource-based naming (`employee.read`, `salary.edit`)
  - `RolePermission` many-to-many mapping table
  - `UserPermission` for per-user overrides (grant/deny)
  - Seed script with full permission matrix per role
- Permission Middleware & Service
  - `requirePermission('resource.action')` middleware
  - `hasPermission(userId, 'resource.action')` service method
  - API endpoints for CRUD on permissions and role-assignments
  - Migration from `requireRoles(['admin'])` to `requirePermission('admin.*')`
- Data Scope Framework
  - `Scope` entity: company, factory, warehouse, department levels
  - `UserScope` mapping (which scopes a user can access)
  - Row-level filtering via scope join in service layer
  - Scope middleware for automatic query filtering
- Frontend Permission Check
  - `<Can permission="salary.read">` component for conditional rendering
  - Permission-based menu visibility
  - Admin panel for managing permissions and scopes

Acceptance criteria:
- API returns 403 when user lacks specific permission (not just role)
- SUPERADMIN bypasses all permission checks
- Permissions can be assigned/unassigned via API without code change
- Data scope filters query results automatically by user's scope
- Frontend hides elements user doesn't have permission for
- Migration path: all existing `requireRoles` → `requirePermission`

Notes:
- SUPERADMIN gets implicit `*:*` permission grant
- Permission check is additive: user has permission if role has it OR user has explicit grant
- Deny always overrides grant (explicit deny takes precedence)
- Scope hierarchy: company > factory > department > warehouse
- Lower scope inherits access from higher scope (factory = all departments under it)
- Completed on 2026-06-12 (seeding + remaining UI finalized in Phase 29).

### Phase 29: Permission Management

Status: Done

Outputs:
- 50 permissions seeded across 6 modules (auth, customers, products, cylinders, inks, orders, jobs, qc, audit, permissions, inventory, reports)
- Role-permission assignment API (CRUD on role_permissions table)
- User permission override UI (grant/deny per user via UserPermission table)
- Permission Management settings page (`/settings/permissions`) with 4 tabs:
  - All Permissions (list, create, delete)
  - Role Permissions (assign/remove per role)
  - User Overrides (grant/deny per user)
  - Data Scopes (list, create, assign to user)
- `PermissionProvider` wired in `providers.tsx` — fetches user's effective permissions on app mount
- `<Can permission="module:action">` component for conditional rendering
- Navigation menu item for Permission Management in Settings sidebar
- Permission card on Settings landing page

Acceptance criteria:
- Seed script populates 30+ permissions across 6 modules
- PermissionProvider fetches permissions on app mount
- Can component conditionally renders UI elements
- Admin can manage permissions from settings page
- Role dropdown in user management respects permission changes

Notes:
- Permission naming convention: `module:action` (e.g., `user:create`, `order:read`).
- Wildcard `*:*` for superadmin, `module:*` for any action in a module.
- Permission middleware, routes, and schema were already in place from Phase 20 — Phase 29 adds seed data, UI, and provider wiring.
- Completed on 2026-06-12.
- `requireApiKey` moved from app-level to individual permission routes; read routes do not require it (frontend compatibility).
- `requirePermission` middleware available for granular route protection.

### Phase 30: Low-Code Configuration Audit

Status: Done

Outputs:
- Comprehensive audit of 18 frontend files identifying **91 hardcoded values** that should be admin-configurable
- Categories of hardcoded findings:
  - Master data (statuses, colors, types, locations, machines, racks, suppliers, solvents, ink types, defect types) — ~35 items
  - Menu/navigation structure and visibility — ~8 items
  - Roles and permissions — ~6 items
  - Approval matrix and workflow rules — ~6 items
  - Dashboard layout configuration, chart colors, widget definitions — ~10 items
  - Language/locale configuration — ~5 items
  - Notification channels and templates — ~4 items
  - Theme options — ~4 items
  - Mock/fallback data — ~3 items
  - UI text not using i18n — ~10 items
- Created `useLocalStorage` hook for persisting admin configuration across sessions
- Setup page (Master Data, Rules, Approval Matrix) now persists to localStorage — admin edits survive page refresh
- Removed hardcoded `ROLE_VISIBILITY` from approvals page — filtering uses `visibleToRoles` from matrix config
- Removed hardcoded `refTypeIcon` switch — icons stored in localStorage, editable via admin
- Removed hardcoded `docTypes`, `approverRoles`, `notifTemplates` arrays — replaced with free-text input or `ROLES` constant
- Added `approvals.superRoleBanner` i18n key to all 5 locales (was hardcoded Thai text)
- Sidebar navigation MENU and languages still need to be made configurable (Phase 31)

Acceptance criteria:
- Admin can add/edit/delete master data categories and items via Setup UI (persisted to localStorage)
- Admin can add/edit/delete approval matrix entries with multi-step chains and role visibility
- Admin can add/edit/delete rule engine rules with dynamic condition fields
- New document types can be added without code changes (free-text refType input)
- New roles added to ROLES constant will automatically appear in all dropdowns
- No hardcoded role-to-visibility mapping in approvals page

### Phase 31: Dashboard v2 — Configurable Analytics & Visualization

Status: In Progress

Outputs:
- Dashboard Card System (replace static grid)
  - Cards are stored in localStorage as configurable definitions
  - Admin can add/remove/reorder/resize cards via UI
  - Each card has: title, size (col-span, row-span), chart type, data source
  - Drag-to-resize handles on card edges (like grafana grid)
  - Card settings panel for configuration
- Supported Chart Types (14 chart types):
  - **Time series** — Time-based line, area and bar charts
  - **Bar chart** — Categorical charts with group support
  - **Stat** — Big stat values & sparklines
  - **Gauge** — Standard gauge visualization
  - **Bar gauge** — Horizontal and vertical gauges
  - **Table** — Supports many column styles
  - **Pie chart** — The new core pie chart visualization
  - **State timeline** — State changes and durations
  - **Heatmap** — Like a histogram over time
  - **Status history** — Periodic status history
  - **Histogram** — Distribution of values presented as a bar chart
  - **Text** — Supports markdown and html content
  - **Alert list** — Shows list of alerts and their current status
  - **Dashboard list** — List of dynamic links to other dashboards
- Data Source Configuration
  - Each card can be configured with a data source (API endpoint, metric path)
  - Built-in data sources: cylinder stats, ink expiry, QC metrics, production throughput, job status, alert count
  - Custom metric builder UI for selecting field, aggregation, filter
  - Auto-refresh interval per card (off / 10s / 30s / 1m / 5m)
- Card Layout System
  - CSS Grid-based layout with configurable column spans (1-4) and row spans (1-3)
  - Drag handle on each card for repositioning
  - Resize handle on bottom-right corner
  - Layout persists to localStorage per user
  - "Edit Dashboard" mode toggle for entering config mode
  - "Add Card" button that opens card template picker
- Preset Dashboard Templates
  - Executive overview (stats + sparklines + gauges)
  - Operations (time series + bar chart + heatmap)
  - Quality (pie chart + state timeline + stat cards)
  - Custom (blank grid to build from scratch)

Acceptance criteria:
- Cards can be added, removed, moved, and resized without code changes
- All 14 chart types render correctly with mock data
- Each card can be configured with different data source
- Layout persists on page refresh
- Admin can create custom dashboards
- Dashboard works in all 3 themes

### Phase 32: Dynamic Menu & Role Management

Status: Not Started

Outputs:
- Sidebar MENU structure stored in localStorage — admin can show/hide menu items
- Menu item visibility per role (which roles see which nav items)
- Custom menu items (admin adds external links)
- Dynamic language management (enable/disable TH/EN/CN/JA/MM)
- Dynamic theme management (enable/disable modern/dark/light)
- ROLES constant replaced with localStorage-driven role list
- All hardcoded option selects now driven from localStorage

Acceptance criteria:
- Admin can hide/show sidebar menu items
- Different roles see different navigation items
- Admin can add custom external links to sidebar
- Languages can be enabled/disabled from admin panel
- New roles can be added without code changes

### Phase 21: Approval Workflow Engine

Status: Done

Outputs:
- Workflow Definition System
  - JSON-based workflow configuration (stored in DB + validated)
  - Multi-step approval chains with branching
  - Configurable approver per step (role, user, or dynamic)
  - Escalation timers (auto-escalate if not approved within N hours)
  - Conditional routing (e.g. amount > 100000 → director approval)
- Built-in Workflows
  - Leave request (employee → manager → HR)
  - Purchase order (requester → manager → purchasing → director)
  - Inventory adjustment (warehouse → supervisor → manager)
  - Sales discount override (sales → manager → director)
- Workflow API & UI
  - `GET /api/v1/workflows/pending` — current user's pending approvals
  - `POST /api/v1/workflows/:id/approve` / `reject`
  - Approval dashboard widget showing pending count + action buttons
  - Email/notification trigger on each step transition
  - Full audit trail for every approval action

Acceptance criteria:
- New workflow can be defined via JSON and stored to DB
- Approval chain executes steps in order with correct approver assignment
- Escalation triggers after configured timeout
- Audit log records every approve/reject action with user + timestamp
- Frontend shows pending approvals badge in navbar
- Notification sent (WebSocket + future Email/LINE) on status change

### Phase 22: Database Schema Isolation

Status: Done

Outputs:
- Domain-Based Schema Separation
  - `auth` schema: users, roles, permissions, refresh_tokens
  - `hr` schema: employees, departments, attendance, leave
  - `payroll` schema: salary, pay_slips, tax_records
  - `inventory` schema: products, cylinders, ink, warehouse
  - `production` schema: jobs, logs, qc_inspections
  - `sales` schema: orders, customers, invoices
  - `audit` schema: audit_logs (separated for retention management)
- Multi-Schema Prisma Setup
  - Prisma multi-schema preview feature or raw SQL fallback
  - Each domain module points to its own schema
  - Cross-schema queries via Prisma `@@schema` or raw views
  - Migration scripts per schema
- Schema Ownership Rules
  - Module A reads module B's data only through service calls (no direct query)
  - Cross-schema foreign keys via logical references (not physical FK)
  - Event-driven sync for cross-domain data replication

Acceptance criteria:
- Tables organized into domain schemas (not all in `public`)
- Migration creates correct schema + tables per domain
- Existing data migrated to new schemas without loss
- No cross-schema direct queries in service code

### Phase 23: API Security Hardening

Status: Done

Outputs:
- HTTP Security Headers
  - `helmet` middleware for all response headers (CSP, X-Frame-Options, HSTS, etc.)
  - Strict-Transport-Security (HSTS) for HTTPS enforcement
  - Content-Security-Policy headers for XSS prevention
- CORS Hardening
  - Whitelist-based origin validation (not `origin: '*'`)
  - Preflight cache optimization
  - Credential policy per endpoint
- Input Validation Layer
  - Zod schemas for all request bodies (replacing manual checks)
  - Validation middleware with typed error responses
  - Query parameter sanitization
  - File upload size + type validation
- API Key Support for Machine-to-Machine
  - API key model + authentication middleware
  - Key rotation and expiry
  - Rate limit by API key (separate from user rate limit)
- Audit for Permission Changes
  - All permission/role changes logged to audit_logs
  - Immutable audit trail for access control changes
  - Review endpoint for recent permission grants

Acceptance criteria:
- Security headers present on all responses (verified via securityheaders.com)
- CORS rejects requests from unknown origins
- Zod validation returns consistent error format
- API key auth works alongside JWT auth
- Permission changes are fully auditable

### Phase 24: Observability & Monitoring Stack

Status: Done

Outputs:
- Grafana + Loki + Prometheus Stack
  - Docker Compose services for Grafana, Loki, Prometheus
  - Application metrics exposed via Prometheus client (API latency, error rate, request count)
  - Loki log aggregation from JSON-formatted container logs
  - Pre-built Grafana dashboards:
    - API performance (latency p50/p95/p99, error rate, throughput)
    - System health (CPU, memory, DB connections, Redis)
    - Business metrics (orders/day, jobs/day, active users)
- Alert Rules
  - Prometheus AlertManager rules for:
    - DB down > 30s
    - Redis down > 30s
    - API error rate > 5% over 5 min
    - Disk usage > 90%
    - Memory usage > 90%
  - Alert dispatch via webhook to Telegram/LINE
- Structured Dashboard
  - Grafana accessible at `/monitoring` subpath (behind auth)
  - Dashboard variables for environment, module, user
  - Log explorer with Loki (search by correlation ID, user, action)

Acceptance criteria:
- Grafana accessible and shows live metrics
- API latency metrics visible on dashboard
- Alert triggers and sends webhook notification
- Log searchable by correlation ID
- Stack startup time < 2 minutes

### Phase 25: Notification Service Gateway

Status: Done

Outputs:
- Notification Module Abstraction
  - `NotificationProvider` interface:
    ```typescript
    interface NotificationProvider {
      send(to: string, message: string, options?: any): Promise<boolean>;
    }
    ```
  - Built-in providers:
    - **LINE Messaging API** (official API with bot token)
    - **Telegram Bot** (via `node-telegram-bot-api`)
    - **SMTP Email** (nodemailer with template support)
    - **WebSocket Push** (existing socket.io infrastructure)
  - Provider registry with channel selection per notification type
- Template Engine
  - Handlebars-based message templates stored in DB
  - Per-language templates (TH/EN/CN/JA/MM)
  - Dynamic variable injection (`{{username}}`, `{{amount}}`, etc.)
  - Template preview API
- Notification Preferences
  - User opt-in/opt-out per channel
  - Per-notification-type channel selection
  - Quiet hours configuration
  - Digest mode (batch notifications, send once per N hours)
- Delivery Tracking
  - Notification log with status (pending/sent/failed)
  - Retry logic with exponential backoff (max 3 retries)
  - Delivery failure alert to admin

Acceptance criteria:
- Notification sent successfully via LINE, Telegram, and Email
- Template renders with correct variable substitution
- User can opt out of specific channels
- Failed delivery retried and logged
- Audit log records every notification sent

### Phase 26: File Storage Layer

Status: Done

Outputs:
- `FileMetadata` Prisma model under `@@schema("storage")`
- `StorageProvider` interface with `MinioProvider` (aws-sdk S3-compatible) and `LocalStorageProvider` (dev filesystem)
- Sharp integration for thumbnail generation (200×200, configurable)
- File upload/download/delete API routes (`POST /upload`, `GET /files/:id`, `DELETE /files/:id`, `GET /files/entity/:type/:id`)
- MinIO service in Docker Compose (port 9000 API, 9001 console) with healthcheck
- `gravure-files` bucket auto-created on first use via `mc mb`

Acceptance criteria:
- File upload stores correct content and returns metadata with ID
- Download returns original content with correct MIME type
- Signed URL generation works
- File deletion cleans up storage and database
- All 6 storage E2E tests pass

### Phase 27: AI Gateway & IoT Architecture

Status: Done

Outputs:
- Prisma models under `@@schema("ai")`: `AiProvider`, `AiPromptTemplate`, `AiChatLog`, `AiApiKey`
- Multi-provider AI abstraction (`AiProviderInterface`) with `OpenAIProvider`, `AnthropicProvider`, `OllamaProvider`
- Prompt template engine (Handlebars-style, stored in DB, per-language)
- Cost tracking per chat log (input/output tokens, duration, cost)
- Prisma models under `@@schema("iot")`: `Device`, `DeviceTelemetry`
- Device registry CRUD API
- Telemetry ingestion endpoint (deviceId + key/value/unit readings)
- Telemetry query with time range and key filters
- MQTT publish endpoint (stub — logs action)

Acceptance criteria:
- AI provider CRUD works (create/list/delete)
- Prompt template creation and rendering with variable substitution works
- Device registration, telemetry ingestion, and querying all work
- Latest telemetry per device per key available
- All 16 AI + IoT E2E tests pass

### Phase 28: Production Deployment & Disaster Recovery

Status: Done

Outputs:
- Cloudflare Tunnel service (`cloudflared`) in docker-compose under `production` profile
- `scripts/backup.sh` — DR backup automation: PostgreSQL dump, Redis RDB, MinIO mirror, config archive
- `scripts/load-test.js` — k6 script with 3-stage ramp (20→50→100 users), 5 endpoints (cylinders, inks, jobs, orders, IoT, AI)
- `scripts/security-audit.sh` + `container-audit.sh` — 7 checks: JWT strength, CORS, API keys, DB access, Redis, npm audit, container health
- `secrets/` directory with 7 secret files (`db_url`, `db_password`, `redis_url`, `jwt_secret`, `jwt_refresh_secret`, `api_keys`)
- Retention-based backup cleanup (daily 7, weekly 4, monthly 3)

Acceptance criteria:
- docker-compose config validates with cloudflared service
- Backup script handles all data stores (PostgreSQL + Redis + MinIO + config)
- k6 load test runs without errors and reports metrics
- Security audit produces pass/fail report for each check
- All 28 phases complete and verified

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
| 2026-06-12 | Use `useLocalStorage` hook for admin config persistence instead of backend API | Instant save/load, works offline, no DB schema changes needed; backend sync can be added later |
| 2026-06-12 | Merge Rules + Approvals into single Workflow Engine tab with 3 sub-tabs | Eliminated duplicate route tabs; combined All view gives holistic oversight |
| 2026-06-12 | Replace hardcoded refTypeIcon switch with localStorage JSON map | Admin adds new doc types with icons without code changes |
| 2026-06-12 | Approval matrix uses per-row visibleToRoles instead of global ROLE_VISIBILITY map | Each doc type has independent visibility rules, fully admin-configurable |
| 2026-06-12 | Dashboard v2 to use CSS Grid drag-to-resize system (react-grid-layout or native) | Supports all 14 chart types, admin-configurable per card |
| 2026-06-12 | Sidebar MENU, languages, and roles to be made configurable via localStorage | Final step to eliminate remaining hardcoded config items |
| 2026-06-09 | Recommend Redpanda for local Kafka-compatible development | Easier Docker Compose setup while preserving Kafka API compatibility |
| 2026-06-09 | Upgrade frontend baseline from Next.js 15 to Next.js 16 | New project should start on the current official major instead of a previous major |
| 2026-06-09 | Use Node.js 24 LTS as the default runtime baseline | Node.js 24 is Active LTS with a longer support window for new services |
| 2026-06-09 | Use Tailwind CSS 4, Express 5, and Prisma ORM 7.x for new code | Avoid starting new project code on older major lines when stable newer versions exist |
| 2026-06-09 | Consolidate from 14 microservices to modular monolith / necessary services | Simplify deployment, reduce overhead, and keep resource usage low as requested by owner |
| 2026-06-10 | Focus next development cycle on Frontend API Integration & Polish | All 13 backend phases complete; frontend pages have full UI with mock data but need real API wiring. Identity, monitoring, and hardening follow in subsequent cycles. |
| 2026-06-12 | Adapt identity-service Role & Permission approach into Phase 29 | Backend schema, middleware, and routes already existed — only seed data, PermissionProvider wiring, and UI were needed. `requireApiKey` moved from app-level to write-only routes for frontend compatibility. |

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
| 2026-06-11 | 22-28 | All Phases 22-28 completed: Schema Isolation, API Security, Observability, Notifications, File Storage, AI/IoT, Production Deploy & DR |
| 2026-06-12 | 20 | Marked Phase 20 Done — seed script, permission routes, and frontend provider all finalized |
| 2026-06-12 | 29 | Started Phase 29 — 50 permissions seeded, PermissionProvider wired, /settings/permissions UI with 4 tabs, navigation updated |
| 2026-06-12 | 29 | Completed Phase 29 — all permission management backend + frontend finalized |
| 2026-06-12 | 30 | Completed Phase 30 — low-code audit of 91 hardcoded items across 18 files; useLocalStorage hook created; setup page persisted; approvals page made low-code; all i18n gaps filled |
| 2026-06-12 | 31 | Started Phase 31 — Dashboard v2 card system with 14 chart types, data source config, CSS Grid resizable layout |
| 2026-06-12 | 31 | Phase 31 implementation: 14 chart components created (recharts + custom SVG), DashboardCard with resize/drag, AddCardDrawer, preset templates (executive/operations/quality/custom), DashboardGrid layout manager, homepage refactored to use DashboardGrid. Build passes. recharts added as dependency. |
| 2026-06-12 | 31 | Added 3 new chart types (stackedBar, cylinderStatus, activityFeed) + redesigned alert-list-chart + rebuilt with react-grid-layout v2.2.3 (legacy API). Drag/resize/edit titles/settings config working. CylinderStatusChart with 5 KPI cards. ActivityFeedChart with formatKey+args i18n. StatChart fixed (icon, sparkline, tLabel). AlertListChart rich layout. 16 chart types total. Build passes. |
| 2026-06-12 | 31 | Added LocationChart — 6-position cylinder location grid (Rack A-D, Machine Area, QC/Repair) with progress bars. New chart type `location`. Drodown shows Thai names via `chart.*` locale keys. All 5 languages updated. Docker rebuilt & restarted. Build passes. |
