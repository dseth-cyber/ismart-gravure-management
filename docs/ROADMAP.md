# Gravure Management System Roadmap

Last updated: 2026-06-27 (Phase 43)
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
| 30 | Security Audit Logs, Mandatory Fields and Cleanups | Done | Comprehensive audit logs, PDPA logs cleanups, required fields settings and soft deletes trash bin |
| 31 | Dashboard v2 & CSS Grid Layout | Done | Dashboard v2 card system with 16 chart types, custom layouts, drag-and-resize, and data source configurations |
| 32 | Dynamic Menu & Role Management | Done | Dynamic roles manager UI, db string migration, custom role mapping, and flexible role assignment |
| 33 | React Query Upgrade & List Page Optimization | Done | TanStack React Query v5 integration, caching configuration, invalidation hooks, list page optimization |
| 34 | Dashboard Layout Persistence | Done | Dashboard grid layouts saved to DB via /api/v1/layouts; admin default + user override per origin |
| 35 | Soft Delete & Trash Bin | Done | deletedAt on 6 models; trash UI with restore, permanent delete, empty trash on all list pages |
| 36 | User Management CRUD | Done | Add/Edit/Delete users with email, password reset; email field on User model; role text badge |
| 37 | TLS/HTTPS Hardening & Infrastructure Security | Done | Caddy reverse proxy with auto HTTPS; internal network isolation; secure exposed ports; Cloudflare TLS upgrade;
| 38 | Security Hardening — Score 9.0 | Done | Zod login validation, XSS sanitization, file upload MIME+magic bytes, immutable audit logs, security tests, secrets rotation script, npm audit CI, remove hardcoded secrets, cAdvisor capabilities, read-only Docker socket |
| 39 | Security Hardening — Score 10.0 | Done | CSP nonce replacement, Coraza WAF with OWASP CRS, Trivy container scanning, Dependabot, OWASP ZAP pentest, incident response plan, anomaly detection Prometheus rules |
| 40 | Role DB & Permission Overrides | Done | Role model in DB, inline permission overrides, batch grant/deny API |
| 41 | Sidebar Permission Filtering & Page Guard | Done | Permission-based sidebar filtering, page-level access guard |
| 42 | Batch Permission UX — Module-level, Multi-user, Search & Filter | Done | Select All per module, multi-user batch, search + filter |
| 43 | Permission Cleanup & Sidebar Fixes | Done | Complete permission seeding (58 total), fix sidebar filtering, add approvals menu, remove Menu Visibility |

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
- 58 permissions seeded across 8 modules (auth, customers, products, cylinders, inks, orders, jobs, qc, audit, permissions, inventory, reports, approvals, settings)
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
- Seed script populates 58 permissions across 8 modules
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

Status: Done

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

Status: Done

Outputs:
- ROLES constant replaced with localStorage-driven role list (Completed)
- All hardcoded option selects now driven from localStorage (Completed)
- New roles can be added and managed via UI settings without code changes (Completed)
- Sidebar MENU structure stored in localStorage — admin can show/hide menu items
- Menu item visibility per role (which roles see which nav items)
- Custom menu items (admin adds external links)
- Dynamic language management (enable/disable TH/EN/CN/JA/MM)
- Dynamic theme management (enable/disable modern/dark/light)

Acceptance criteria:
- Admin can hide/show sidebar menu items
- Different roles see different navigation items
- Admin can add custom external links to sidebar
- Languages can be enabled/disabled from admin panel
- New roles can be added without code changes

Notes:
- Completed on 2026-06-16.


### Phase 33: React Query Upgrade & List Page Optimization

Status: Done

Outputs:
- Caching framework setup (QueryClientProvider, staleTime: 60s)
- React Query integrations in list views (Cylinders, Inks, Users, Audit logs)
- Cache invalidation triggers for CRUD operations (creates, updates, deletes, restores)
- Instant transitions (0s load latency) between dashboard/master pages

Acceptance criteria:
- Navigation between pages loads cached lists instantly
- Background syncing handles silent updates
- Mutations invalidate cache and reload lists automatically
- All pages compile successfully and pass type checking

Notes:
- Completed on 2026-06-16.
- All upgraded components compile cleanly and data loads instantly.

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

### Phase 29: Permission Management

Status: Done

Outputs:
- Seed script with default permissions for all 8 roles
- Role-Permission assignment API endpoints and wiring
- User Permission override UI dialogs
- Access control catalog page `/settings/permissions`
- PermissionProvider and Can guard component in frontend

Acceptance criteria:
- Seed script populates 58 permissions across 8 modules
- PermissionProvider fetches user permissions on app mount
- Can component dynamically renders UI elements based on permissions
- Admin can manage all roles, permissions, and user scopes directly from UI

### Phase 30: Security Audit Logs, Mandatory Fields, Trash Bin and SearchableSelect

Status: Done

Outputs:
- Log viewer UI tab inside settings audit page with search & filters
- Automated cleanups scheduler to purge logs older than setting days
- Required field check boxes config layout inside settings audit page
- Input validation and visual asterisk indicators on Cylinder, Ink, and User forms
- Soft deletes recycle bin view and restore/purge controls (Frontend + Backend)
- Custom SearchableSelect component supporting filters, modal forms, localized options, and search

Acceptance criteria:
- Primary activities (Create, Edit, Delete, Login, Print Label) are logged with IP address and username
- Retention period is configurable by admin (90 days, 180 days, forever, etc.) and auto-prunes
- Form validation dynamically responds to required settings changes and shows red asterisk next to labels
- Temporarily deleted items can be viewed in trash bin, restored, or permanently deleted (soft deletion)
- All native HTML select elements are replaced with SearchableSelect component, implementing dynamic search for > 5 options, language localization fallback, and proper styling across light, dark, and modern glassmorphic themes

### Phase 31: Dashboard v2 & CSS Grid Layout

Status: Done

Outputs:
- DashboardCard component using react-grid-layout for drag and resize
- 16 chart types including Location Grid, Stat Card, Gauges, Heatmaps, and Activity Feed
- Preset dashboard templates and custom card config drawers
- Dynamic data source configurations

Acceptance criteria:
- Users can drag, resize, add, configure, and delete dashboard cards
- Chart styles and components adapt cleanly to modern/dark/light themes
- Custom layouts persist in local storage

### Phase 37: TLS/HTTPS Hardening & Infrastructure Security

Status: Done

Outputs:
- Caddy v2 reverse proxy service in Docker Compose
  - Automatic Let's Encrypt TLS certificates with auto-renewal
  - TLS termination for backend (backend:5000), frontend (frontend:3000), Grafana (grafana:3001), MinIO Console (minio:9001)
  - HTTP-to-HTTPS redirect (301)
  - Security headers hardening (HSTS preload, CSP, X-Frame-Options, X-Content-Type-Options)
- Docker network isolation
  - `frontend` network: only Caddy + frontend containers
  - `backend` network: only Caddy + backend + database + cache containers
  - `monitoring` network: only Caddy + Grafana + Prometheus + Loki + Alertmanager
  - `storage` network: only Caddy + MinIO
  - Internal services (PostgreSQL, Redis, exporters, Promtail) have no host port exposure
- Port exposure reduction
  - Before: 17 host ports exposed
  - After: 4 host ports exposed (Caddy 80/443, backend 5000 for internal health, MinIO 9000 for S3 API)
  - Cloudflare Tunnel points to Caddy (127.0.0.1:443) instead of directly to backend
- Secure defaults
  - Redis password enabled (`redis://:${REDIS_PASSWORD}@redis:6379`)
  - Loki auth enabled (basic auth or reverse-proxy auth)
  - Grafana admin password from Docker secret (not hardcoded `admin/admin`)
  - All exporter ports internal-only
- Compliance verification
  - securityheaders.com score A+ verified
  - SSL Labs rating A verified
  - HSTS preload list submission ready
  - Automated certificate renewal health check

Acceptance criteria:
- All traffic between browser and server is encrypted (TLS 1.3)
- Internal services are not reachable from outside Docker
- No hardcoded credentials in docker-compose.yml
- Let's Encrypt certificates auto-renew before expiry
- HSTS header present with preload directive
- Cloudflare Tunnel uses TLS to Caddy (not plain HTTP to backend)
- `docker compose up` starts with zero port conflicts
- Security audit script passes all checks (JWT, CORS, headers, TLS, network isolation)

Notes:
- Caddy chosen over nginx for zero-config automatic HTTPS (Caddyfile is ~20 lines vs nginx ~80 lines)
- Cloudflare Tunnel previously pointed directly to backend:5000 (HTTP); now points to Caddy:443 (HTTPS), adding end-to-end encryption
- Redis password stored in Docker secret (`secrets/redis_password.txt`) — existing apps reload env to pick up new `REDIS_URL` with password
- Loki auth enabled via reverse-proxy header check (X-Auth-Request-User), not native Loki auth (to preserve Grafana integration)
- Grafana admin password moved from hardcoded `GF_SECURITY_ADMIN_PASSWORD=admin` to Docker secret
- Port exposure reduced from 17 → 4 ports: a 76% reduction in attack surface
- Completed on 2026-06-16.

### Phase 38: Security Hardening — Score 9.0

Status: Done

Outputs:
- Zod login validation — manual `validateLogin()` replaced with Zod schema `loginSchema` on POST /auth/login
- XSS sanitization middleware — `sanitizeBody()` strips `<script>` tags and HTML from all request bodies globally
- File upload MIME type validation — multer `fileFilter` whitelists 10 MIME types (JPEG, PNG, GIF, WebP, AVIF, PDF, TXT, CSV, XLSX, DOCX)
- File upload magic bytes validation — checks first bytes of uploaded file match declared MIME type (JPEG FF D8 FF, PNG 89 50 4E 47, etc.)
- Immutable audit logs — PostgreSQL trigger `trg_prevent_audit_log_mutation` blocks UPDATE/DELETE on `audit.audit_logs`; cleanup service disables trigger temporarily via raw SQL
- Security test suite — 18 test cases covering: empty/missing login fields, wrong password, forged JWT, unauthenticated access, Zod rejection, security headers (XFO, XCTO, CSP, HSTS), rate limit headers, CORS, audit logging of failed login
- Secrets rotation script — `scripts/rotate-secrets.ps1` generates new cryptographically random values for all 10 secrets, updates all files, prints summary
- npm audit CI script — `npm run audit` runs `npm audit --audit-level=high` to detect CVEs; `npm run audit:fix` auto-fixes where possible
- Hardcoded secrets removed from docker-compose.yml — DB password, Redis URL+password, JWT secrets, MinIO credentials, API keys removed from environment block; backend reads from Docker secrets only
- cAdvisor capabilities — changed from `privileged: true` to specific `cap_add: [SYS_ADMIN, SYS_PTRACE, DAC_READ_SEARCH]`
- Docker socket read-only — promtail socket mount changed to `:ro` to prevent container escape

Acceptance criteria:
- Login with empty/missing fields returns 400 (Zod), not 500
- XSS payloads in input are stripped before reaching controllers
- File upload of `.exe` disguised as `.jpg` is rejected (magic bytes mismatch)
- Direct DELETE on audit_logs returns error 500 (blocked by trigger)
- `npm run test:security` passes all 18 tests
- `scripts/rotate-secrets.ps1` regenerates all secrets without error
- docker-compose.yml contains zero hardcoded secrets

Notes:
- cAdvisor still works with 3 specific capabilities instead of full privileged mode — reduces container escape risk
- Promtail Docker socket is read-only — promtail can read container logs but cannot control Docker daemon
- Immutable audit trigger must be applied via migration SQL in `prisma/migrations/immutable_audit_logs.sql`
- Secrets rotation script should be run before production deployment and periodically every 90 days
- Completed on 2026-06-16.

### Phase 39: Security Hardening — Score 10.0

Status: Done

Outputs:
- CSP nonce replacement — backend `app.ts` removed `'unsafe-inline'` from `styleSrc`; backend `env.ts` updated `HELMET_CSP` default; frontend `middleware.ts` generates per-request nonce for `script-src` and `style-src` with `Content-Security-Policy` header
- Coraza WAF with OWASP CRS — `modsecurity` service in Docker Compose using `owasp/modsecurity-crs:apache` image; Caddy routes `/api/*` through modsecurity before forwarding to backend; frontend rewrites proxy through modsecurity; configured with PARANOIA=1, blocking enabled
- Trivy container scanning — `.github/workflows/trivy-scan.yml` runs on push/PR/weekly scanning backend and frontend images for HIGH/CRITICAL CVEs; `scripts/trivy-scan.sh` for local scanning
- Dependabot — `.github/dependabot.yml` for npm (backend + frontend), Docker (backend + frontend), and GitHub Actions; weekly schedule
- OWASP ZAP DAST scan — `.github/workflows/zap-scan.yml` weekly full scan; `scripts/zap-scan.sh` for local scans; `zap/rules.tsv` with alert suppression for known false positives
- SECURITY.md — vulnerability reporting policy, security controls inventory, secure development practices
- INCIDENT_RESPONSE.md — 5-phase incident response plan (triage → containment → eradication → recovery → post-mortem), severity classification, team roles, communication channels, checklist
- Anomaly detection Prometheus rules — 8 new alert rules in `monitoring/prometheus/alerts.yml`: traffic spike, brute force login, high 4xx rate, WAF block spike, rate limit exceedance, request size anomaly, concurrent session spike, container restart loop

Acceptance criteria:
- CSP header contains `nonce-*` and no `'unsafe-inline'` on HTML responses
- WAF blocks common attack patterns (SQLi, XSS) before reaching backend
- Trivy scan fails CI build when HIGH/CRITICAL CVEs are found
- Dependabot creates PRs for vulnerable dependencies automatically
- ZAP scan runs weekly without blocking pipeline (informational)
- SECURITY.md published at repository root
- Incident response plan documents all 5 phases with team roles
- Anomaly alerts fire for brute force, traffic spikes, WAF blocks

Notes:
- CSP nonce is enforced via Next.js middleware for HTML pages + backend helmet for API responses
- ModSecurity runs with PARANOIA=1 (balanced); PARANOIA=2-4 available for stricter enforcement during attacks
- ModSecurity default allowed_methods excludes PUT/DELETE — fixed post-release via SecAction override in modsecurity-override.conf
- Trivy scans only HIGH/CRITICAL severity — MEDIUM/LOW are reviewed manually
- ZAP full scan targets local Docker stack; production scan requires target URL override
- SECURITY.md includes complete security control inventory for compliance audits
- Anomaly thresholds are conservative (P0/P1); tune after baseline data collection
- common.forbidden, common.forbiddenDesc, common.retry i18n keys were missing from th/cn/ja/mm — added post-release
- Completed on 2026-06-17 (post-release fixes: 2026-06-17).

## Phase 40 — User-Permission Linking (Role DB Model, Inline Assignment, Batch Override)

This phase links the User Management page with the Permission Management system, closing the gap where user creation and permission assignment were separate workflows.

### Requirements
- Move role definitions from localStorage to database-backed Role model
- Allow assigning permission overrides during user creation and editing
- Support batch grant/deny of multiple permission overrides at once

### Implementation
**40A — Role DB Model:**
- Added `Role` model to Prisma schema (`auth.roles` table with id, name, description, isSystem)
- Seeded 8 default roles (admin, sales, planner, production, qc, warehouse, inkroom, viewer) with `isSystem=true` to protect from deletion
- Added `GET /api/v1/permissions/roles`, `POST /api/v1/permissions/roles`, `DELETE /api/v1/permissions/roles/:name` endpoints
- Frontend fetches roles from API; falls back to localStorage if API unavailable
- `handleAddRole`/`handleDeleteRole` now call API instead of localStorage

**40B — Inline Permission Assignment:**
- Extended `POST /api/v1/auth/users` and `PUT /api/v1/auth/users/:id` with optional `permissions` array (`{ permissionId, effect }[]`)
- Backend creates/updates `UserPermission` records alongside user
- Frontend: Add/Edit User dialogs now include a collapsible "Permission Overrides" section
- Edit dialog pre-loads existing user overrides from `GET /api/v1/permissions/users/:userId`

**40C — Batch Permission Override:**
- Added `POST /api/v1/permissions/users/batch-grant` and `POST /api/v1/permissions/users/batch-deny` endpoints
- Frontend: Overrides tab in Permissions page now has checkboxes + "Grant All"/"Deny All" batch action bar

### Notes
- Roles listed via API are read from `auth.roles` table (seeded by `prisma/seed-permissions.ts`)
- Backend `prisma generate` runs in Docker dev stage to keep Prisma client in sync
- `DATABASE_URL` added to docker-compose backend environment for Prisma CLI access inside container
- `seed.ts` updated to use string literals for role instead of removed `Role` enum import
- Build note: `/settings/permissions` page has pre-existing prerender error (useSearchParams without Suspense) unrelated to this phase

## Phase 41 — Sidebar Permission Filtering & Page Guard

This phase adds granular permission-based filtering to sidebar navigation and a page-level access guard. (The admin-configurable Menu Visibility feature was added in Phase 41 originally, but later removed in Phase 43 because permission-based filtering alone is sufficient — see Phase 43.)

### Requirements
- Sidebar should show/hide menu items based on user's effective permissions (default behavior)
- Users navigating directly to a page URL they don't have permission for should see an "Access Denied" page instead of a 403 popup

### Implementation

**41A — Permission-based sidebar filtering:**
- Added `perm` field to each `MenuItem` and `MenuGroup` in the `MENU` constant in `app-layout.tsx`
- Permission mapping: overview→`reports:view`, cylinder→`cylinders:read`, ink→`inks:read`, production→`jobs:read`, system→adminOnly
- Sub-items: production.verification→`jobs:verify`, settings.userMgt→`auth:users.read`, settings.permissions→`permissions:manage`, settings.auditLogs→`audit:read`
- Filter logic uses `usePermission().check()` to filter groups and items; hides group entirely if all items are filtered out
- Admin-only (`system` group) still uses `user?.role === 'admin'` check
- Created `MenuGroup` and `MenuItem` TypeScript types for the MENU constant

**41B — Page-level access guard:**
- Created `RouteGuard` component embedded in `AppLayout` that maps pathname to required permission
- Permission map: `/`→`reports:view`, `/cylinders`→`cylinders:read`, `/production`→`jobs:read`, `/settings/users`→`auth:users.read`, `/settings/permissions`→`permissions:manage`, `/settings/audit`→`audit:read`
- Displays centered "Access Denied" panel with `ShieldAlert` icon when user lacks permission
- Login, progress, and approvals routes are excluded from guard
- Also created standalone `PageGuard` component in `lib/permission/page-guard.tsx` for per-page wrapping use

### Notes
- Permission-based filtering is the default; no admin overrides exist (Menu Visibility was removed in Phase 43)
- Route permission mapping should be kept in sync with MENU definition and backend permission requirements
- `usePermission.loading` is respected to prevent flash of hidden/shown content

## Phase 42 — Batch Permission UX (Module-level, Multi-user, Search & Filter)

This phase addresses the pain points identified in the Phase 41 review: individual permission assignment is too slow when managing many permissions. Adds module-level batch operations, multi-user batch grant/deny, and search/filter to all permission lists.

### Requirements
- Permission assignment per user should support "Select All" per module (not click one-by-one)
- Role permission templates should allow "Add All" / "Remove All" per module
- Ability to grant the same permissions to multiple users at once
- Search and module filter in every permission list

### Implementation

**42A — Module-level batch in User Dialog:**
- Created reusable `PermissionSelector` component (`components/shared/permission-selector.tsx`)
- Groups permissions by module with collapsible sections
- Each module header has a "Select All" checkbox that toggles all permissions in that module
- Search input + module filter dropdown at top of selector
- "Clear" button per module when all are selected
- Replaces the old flat checkbox list in both Create User and Edit User dialogs

**42B — Permission Template per Role (batch per-module):**
- Role-Permissions tab now groups assigned & available permissions by module
- Each module in "Assigned" column has "Remove All" button
- Each module in "Available" column has "Add All" button
- Search input + module filter dropdown with all available modules
- Dedicated `handleModuleGrantAll` / `handleModuleRemoveAll` API handlers with Promise.all

**42C — Multi-User Batch Grant:**
- Overrides tab now shows user checkboxes (up to 20) for selecting multiple users
- Selected users count displayed alongside selected permissions count
- "Grant to N users" / "Deny for N users" buttons appear when multiple users selected
- Uses existing `/api/v1/permissions/users/batch-grant` and `batch-deny` endpoints
- `handleMultiUserBatch` calls API with Promise.all for all selected users + permission IDs

**42D — Search + Module Filter:**
- All Permissions tab: search input + module dropdown, filters table rows
- Role-Perms tab: search + module filter (filters both Assigned and Available columns)
- Overrides tab: search + module filter filters the override permissions list
- User Dialog: PermissionSelector has built-in search + module filter
- Computed `allModules`, `roleModules`, `availModules` for dynamic dropdowns

### Notes
- `PermissionSelector` component is reusable for any permission override UI context
- Multi-user batch uses existing batch-grant/batch-deny endpoints (no backend changes needed)
- API calls use Promise.all for speed; could be optimized with a dedicated multi-user endpoint if needed
- Search is case-insensitive and matches against permission name and module

## Phase 43 — Permission Cleanup & Sidebar Fixes

This phase addresses issues found after Phase 42 release: incomplete permission seeding (51 items showing instead of 58), sidebar filtering not actually applying, missing approvals menu integration, and removal of the unused Menu Visibility feature.

### Requirements
- All seeded permissions must display correctly in the Role Permissions UI
- Sidebar must respect permission-based filtering on every item (not just groups)
- Approvals page must have its own sidebar menu entry visible with correct permission
- Remove the admin-configurable Menu Visibility feature (41B) — permission-based filtering is sufficient and the override layer caused confusion

### Implementation

**43A — Complete permission seeding:**
- Added 5 missing `perm.desc.*` locale keys to all 5 languages:
  - `settings:master.manage`, `workflows:rules.manage`, `workflows:approvals.manage`, `notifications:settings.manage`, `settings:system.manage`
- Added 2 new permissions:
  - `approvals:read` — standalone permission for viewing pending approvals (separate from `workflows:approvals.manage` which controls the approval matrix config)
  - `reports:duplicates.view` — permission under reports module for duplicate detection reports
- Total: 58 permissions across 8 modules, 131 role-permission mappings
- Re-seeded database to apply changes

**43B — Fix sidebar permission filtering:**
- Sidebar rendering was calculating `visibleItems` for group-level filtering but then rendering `group.items` (unfiltered) instead of `visibleMenu` (filtered). Fixed to render `visibleMenu` which contains the correctly filtered items.
- `PermissionProvider` always lacked a `refreshPermissions` function — added so sidebar updates immediately when modifying own role

**43C — Approvals sidebar integration:**
- Added `'approvals'` to default `menuOrder` array, enabling drag-reorder support
- Added `perm: 'approvals:read'` to the approvals menu item definition
- Created `/approvals` route guard with `approvals:read` permission check

**43D — Remove Menu Visibility feature (41B):**
- Removed "Menu" tab from `/settings/system` page (UI, state, API fetch, localStorage wiring, `roleOverrides` check)
- Removed unused `apiClient` import from `app-layout.tsx`
- The `menu_visibility` key in `system_settings` table is orphaned (no code reads it anymore)
- The sidebar now relies solely on permission-based filtering

### Notes
- Permission-based filtering is now the only sidebar visibility mechanism — no admin overrides layer
- The `menu_visibility` data in `system_settings` table is harmless but unused; can be cleaned up if desired
- After deploying, users should refresh browser (F5) to pick up new permissions and sidebar changes

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
| 2026-06-16 | Use Caddy instead of nginx for TLS termination | Caddy provides zero-config automatic Let's Encrypt with auto-renewal; Caddyfile is ~20 lines vs nginx ~80 lines for equivalent config |
| 2026-06-16 | Move all internal services to isolated Docker networks with no host port exposure | Reduces attack surface by 76% (17 ports → 4); prevents direct DB/Redis/Monitoring access from host |
| 2026-06-16 | Store Redis password and Grafana admin password in Docker secrets | Eliminates hardcoded credentials in docker-compose.yml; consistent with existing secrets pattern |
| 2026-06-16 | Replace manual validateLogin() with Zod schema | Consistent input validation across all routes; better error messages; removes custom manual validation function |
| 2026-06-16 | Add XSS sanitization as global middleware | Catches script injection across all input points without per-route changes |
| 2026-06-16 | Implement immutable audit log via PostgreSQL trigger | Prevents tampering with audit records; cleanup uses temporary trigger disable via raw SQL |
| 2026-06-16 | Change cAdvisor from privileged to specific capabilities | Reduces container escape risk while maintaining required functionality |
| 2026-06-16 | Implement CSP nonce via Next.js middleware instead of backend-only helmet | Frontend serves HTML pages — CSP must be set at the HTML-rendering layer; backend helmet covers API JSON responses |
| 2026-06-16 | Route API traffic through ModSecurity WAF via Caddy and Next.js rewrites | Ensures ALL API calls (direct + proxied) go through WAF inspection; single backend target simplifies configuration |
| 2026-06-16 | Use owasp/modsecurity-crs:apache instead of Coraza standalone | More battle-tested, well-documented Docker image, supports OWASP CRS natively |
| 2026-06-16 | Anomaly detection thresholds set conservative (P0/P1 only) | Avoid alert fatigue during initial baseline collection; tighten after 2 weeks of production data |
| 2026-06-16 | Skip mTLS PostgreSQL, Vault, pg_tde for Phase 39 | High complexity-to-value ratio for current stage; revisit when compliance requires it |
| 2026-06-17 | Allow PUT/DELETE methods in ModSecurity OWASP CRS via tx.allowed_methods override | OWASP CRS default whitelist excludes PUT/DELETE — blocks dashboard layout auto-save (PUT /api/v1/layouts/me) and any other REST write operations |
| 2026-06-17 | Added missing i18n keys common.forbidden, common.forbiddenDesc, common.retry to th/cn/ja/mm locales | The 403 error dialog title showed raw key name because these keys only existed in en.json |
| 2026-06-17 | Migrate role definitions from localStorage to database-backed Role model | Eliminates single source of truth problem; roles persisted across sessions and devices; enables API-based role listing for permission assignment |
| 2026-06-17 | Allow permission override assignment during user creation/editing | Previously required 2-step flow (create user → navigate to overrides tab → grant/deny individually); now inline in the create/edit dialog |
| 2026-06-17 | Add DATABASE_URL to docker-compose backend env | Needed for Prisma CLI (`prisma db push`, `prisma generate`, `prisma migrate`) to work correctly inside the Docker container |
| 2026-06-17 | Add npx prisma generate to Docker dev stage | Previously only ran in builder stage; dev stage needs Prisma client for new models |
| 2026-06-17 | RouteGuard embedded in AppLayout instead of per-page PageGuard | Avoids modifying every page file; single entry point maps pathname → required permission; PageGuard also available for per-page granular control |
| 2026-06-17 | Created reusable PermissionSelector component for user dialog permission overrides | Both Create and Edit User dialogs had duplicated checkbox-per-permission UI; extract into shared component with search, module filter, and Select All per module |
| 2026-06-17 | Group role-perms tab by module with Add All / Remove All per module | Previously all permissions were in a flat list — admin had to click each one individually; module grouping enables bulk operations |
| 2026-06-17 | Multi-user batch grant uses Promise.all over existing single-user API endpoints | Avoids backend changes; multi-user endpoint could be added later if performance becomes an issue |
| 2026-06-27 | Remove admin-configurable Menu Visibility feature (41B) | Permission-based filtering alone is sufficient; the override layer caused confusion and added unnecessary complexity |
| 2026-06-27 | Add `approvals:read` as standalone permission | Separate from `workflows:approvals.manage` (approval matrix config); needed for viewing pending approvals |
| 2026-06-27 | Add `reports:duplicates.view` permission | Enables granular control over duplicate detection report access |

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
| 2026-06-16 | 37 | Added Caddy reverse proxy with auto HTTPS; 17 exposed ports reduced to 4; Docker network isolation implemented; Redis password + Grafana admin moved to Docker secrets; Cloudflare Tunnel upgraded to TLS |
| 2026-06-16 | 38 | Zod login validation, XSS sanitization middleware, file upload MIME+magic bytes check, immutable audit logs (trigger), 18 security tests, secrets rotation script, npm audit CI, removed hardcoded secrets from compose, cAdvisor capabilities, read-only Docker socket |
| 2026-06-16 | 39 | CSP nonce (middleware.ts + helmet update), Coraza WAF (ModSecurity + OWASP CRS), Trivy CI scan, Dependabot, OWASP ZAP weekly scan, SECURITY.md + INCIDENT_RESPONSE.md, anomaly detection Prometheus rules |
| 2026-06-17 | 39 | Post-release fix: ModSecurity allowed_methods — added PUT/DELETE to OWASP CRS method whitelist (rule 911100 false positive) |
| 2026-06-17 | 39 | Post-release fix: i18n — added missing common.forbidden/forbiddenDesc/retry keys to th, cn, ja, mm locales |
| 2026-06-17 | 40A | Role DB Model — Prisma schema Role model, seed, CRUD API, frontend fetch from API |
| 2026-06-17 | 40B | Inline permission assignment — extended user create/edit with permission overrides array |
| 2026-06-17 | 40C | Batch permission override — API endpoints + frontend batch grant/deny in overrides tab |
| 2026-06-17 | 41A | Permission-based sidebar filtering — perm field on MENU items, filter with usePermission().check() |
| 2026-06-17 | 41B | Page-level access guard — RouteGuard in AppLayout + standalone PageGuard component |
| 2026-06-17 | 42A | Module-level batch in User Dialog — PermissionSelector component with Select All per module |
| 2026-06-17 | 42B | Batch per-module for role permissions — Add All / Remove All per module in role-perms tab |
| 2026-06-17 | 42C | Multi-user batch grant — user checkboxes in overrides tab, grant/deny to multiple users at once |
| 2026-06-17 | 42D | Search + Module Filter — search and module dropdown in All Permissions, Role-Perms, Overrides tabs, and User dialog |
| 2026-06-27 | 43A | Incomplete permission fix — added 5 missing perm.desc.* locale keys, 2 new permissions (approvals:read, reports:duplicates.view), total 58 permissions |
| 2026-06-27 | 43B | Sidebar filter fix — changed rendering from raw group.items to filtered visibleMenu; added refreshPermissions() to PermissionProvider |
| 2026-06-27 | 43C | Approvals sidebar integration — added approvals menu item, permission guard, drag-reorder support |
| 2026-06-27 | 43D | Remove Menu Visibility feature — removed Menu tab from /settings/system, all related code in app-layout.tsx |
