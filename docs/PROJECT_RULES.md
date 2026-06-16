# Project Rules

Last updated: 2026-06-16

These rules are mandatory for all future development of Gravure Management System.

## Non-Negotiable Rules

1. Do not build new production UI directly inside `Gravure System (standalone).html` after migration starts.
2. New frontend work must use Next.js 16 + React 19 + TypeScript 5.x.
3. New backend work must use Node.js 24 LTS + TypeScript 5.x + Express 5 + Prisma ORM 7.x.
4. Backend services may be consolidated into a single backend application (Modular Monolith) sharing a single PostgreSQL database to keep the architecture simple.
5. Frontend API calls must go through the shared axios client.
6. Protected API calls must attach JWT automatically through an axios interceptor.
7. JWT token must be stored in `localStorage` unless the project owner later changes this rule.
8. All visible UI text must use `t('key')`.
9. Do not hardcode visible UI labels, table headers, dialog text, button text, status text, or validation text in React components.
10. All new pages must render inside the shared `Layout` component.
11. All new dialogs/popups/modals must use shared dialog components.
12. Theme-dependent styling must come from `themeConfig` through `useTheme()`.
13. Do not create page-specific one-off themes.
14. If a consolidated backend is used, the frontend calls the backend API directly.
15. Databases can be shared or split into logical tables/schemas within the same instance.
16. Access Control & UI Self-Service: All settings, permissions, and data scopes must be fully manageable (created, edited, deleted) directly through the UI without requiring source code modifications or manual database scripts.
17. Activity Audit Trail: Every primary action (such as Add/Create, Edit/Update, Delete, Login, and Print Label) must be recorded in the system audit logs, capturing the exact operation, operator details, and the client's IP address.
18. Auto-Pruning Log Retention: The backend must support automated pruning/deletion of old log history once logs exceed the configured retention settings.
19. Dynamic Form Validation: Form layouts for creating/editing assets must respect dynamic required field settings (covering all input fields in the system), show appropriate validation indicators (such as red asterisks), and enforce validation checks before submission.
20. Soft-Deletion and Trash Bin (Frontend + Backend): Soft-deleted entities must be relocated to a Trash Bin view to allow users to either restore them or permanently delete them, fully supported on both frontend and backend.
21. Roadmap & Progress Synchronization: Every time a new module, function, or service is added or updated, it must be synchronized and documented in the Roadmap UI page and all related progress cards (such as Phases, Architecture Baseline, and Control Documents).
22. Searchable Dropdowns: This project uses ONLY the custom `SearchableSelect` component for all dropdown selects. Native `<select>` elements or other custom select wrappers are strictly prohibited. The search capability must be enabled dynamically when the option count exceeds 5 items. Dynamic rendering rules, localized formatting, and filter-clearing behavior must follow the SearchableSelect guidelines.
23. Standard List Page Pattern (React Query + Sort + Filter + Trash): All list pages must follow the standardized Next.js React Query pattern for fetching, pagination, filtering, column sorting, soft-deleted trash toggle, and column selection. Do not use local React state + `useEffect` for data fetching. Invalidate react-query cache keys instead of calling fetch functions directly. All styling (tables, inputs, filters) must strictly utilize `themeConfig` tokens.
24. Dashboard Layout Persistence: Dashboard grid layouts (card positions, sizes, extra cards, hidden cards, chart configurations) must be persisted to the backend database via the `/api/v1/layouts` API. Admin saves the default layout (key: `default`) that all users inherit on first visit. Each user's personal customization is saved under (`user:{userId}`). Reset clears the user's personal entry and falls back to the admin default. This ensures layout consistency across different origins (localhost vs LAN IP) where localStorage is per-origin and cannot be shared.
25. TLS/HTTPS Enforcement: All external-facing services must be behind a TLS-terminating reverse proxy (Caddy). Internal services (DB, Redis, exporters) must NOT expose ports to the Docker host — they communicate only over Docker internal networks. Cloudflare Tunnel must point to the reverse proxy (TLS), not directly to the backend (HTTP).
26. Infrastructure Security: Internal services (PostgreSQL, Redis, MinIO, Prometheus, Loki, exporters) must NOT bind to host ports. Redis must always have a password. Grafana admin credentials must come from Docker secrets, never hardcoded. The Docker socket must not be mounted into application containers.


## Frontend Rules

Required stack:
- Next.js 16
- React 19
- TypeScript 5.x
- Tailwind CSS 4
- `react-i18next`
- axios

Runtime baseline:
- Node.js 24 LTS for development, CI, Docker images, frontend tooling, and backend services.
- Next.js 16 requires Node.js 20.9 or newer; this project standardizes on Node.js 24 LTS unless a documented compatibility blocker appears.

Required theme support:
- `modern`
- `dark`
- `light`

Default theme:
- `modern`

Required language support:
- Thai: `th`
- English: `en`
- Chinese: `cn`
- Myanmar: `mm`
- Japanese: `ja`

Default language:
- Thai (`th`)

Required locale files:
- `/src/i18n/locales/th.json`
- `/src/i18n/locales/en.json`
- `/src/i18n/locales/cn.json`
- `/src/i18n/locales/mm.json`
- `/src/i18n/locales/ja.json`

Required hooks:
- `useTheme()`
- `useTranslation()` from `react-i18next`

Required shared components:
- `Layout`
- `AppDialog`
- `ConfirmDialog`
- `FormDialog`
- `PageHeader`
- `DataTable`
- `StatusBadge`
- `AppButton`
- `AppInput`
- `AppSelect`

## Dialog And Popup Rules

Do:
- Use shared dialog components only.
- Pass title/body/action labels as translation keys.
- Use `themeConfig.dialog`, `themeConfig.panel`, `themeConfig.button`, and related design tokens.
- Keep dialog behavior consistent: close, cancel, confirm, loading, disabled state, validation error.

Do not:
- Create new modal markup inside a page.
- Create custom overlay/backdrop styling per page.
- Hardcode dialog text.
- Use browser `alert()`, `confirm()`, or `prompt()` for production workflows.

## i18n Rules

Do:
- Use `const { t } = useTranslation()`.
- Use keys like `common.save`, `nav.dashboard`, `cylinder.status.available`.
- Add each new key to all five locale files in the same change.
- Keep technical codes such as IDs, SKUs, job numbers, and status enum values separate from translated labels.

Do not:
- Hardcode Thai, English, Chinese, Myanmar, or Japanese text in JSX.
- Add a key in only one language.
- Use the old standalone `zh` code in the migrated app. Use `cn`.

## Theme Rules

Do:
- Use `const { themeConfig } = useTheme()`.
- Use classes from `themeConfig`.
- Add new design tokens only when they are reusable across pages.
- Keep default visual direction as Modern Glassmorphism.

Do not:
- Hardcode one-off gradients for individual pages.
- Build components that only work in one theme.
- Add page-specific color palettes.

## Backend Rules

Required stack:
- Node.js 24 LTS
- TypeScript 5.x
- Express 5
- Prisma ORM 7.x stable
- PostgreSQL

The backend can be organized as a Modular Monolith or split into a few necessary services. It must include:
- `/health`
- structured error handling
- Prisma schema(s)
- migration scripts
- environment variable documentation
- API contract documentation

Database rules:
- Consolidated backend shares a single database server.
- Logical schema separation or clear table prefixes are recommended for future-proofing.

## Authentication And Authorization Rules

Identity Service owns:
- login
- logout if implemented server-side
- refresh token flow if implemented
- user identity
- JWT signing and validation rules

Frontend owns:
- storing access token in `localStorage`
- attaching token through axios interceptor
- redirecting unauthenticated users from protected routes
- showing permission-based navigation

Authorization should support role-based access control.

Recommended roles:
- `admin`
- `sales`
- `planner`
- `production`
- `qc`
- `warehouse`
- `inkroom`
- `viewer`

## Modular Monolith & Service Rules

Each domain/service must be built either as an independent standalone Microservice OR as a strictly isolated module within a Modular Monolith. If built within a Modular Monolith:
1. **Strict Logical Isolation**: It must own its own logical routes, handlers, and business logic.
2. **Database Separation**: It must define its own tables/Prisma schema. Direct cross-module SQL joins or database-level foreign keys are prohibited; cross-module queries must go through service-layer APIs.
3. **Easy Extraction**: The module must be designed so that it can be extracted into a standalone Microservice at any time without changing its core implementation.

Modules/Services must not:
- depend directly on frontend-specific types or other modules' internal helper methods.

## Event Rules (Optional)

If asynchronous integration is required:
- Simple queues (e.g., Redis-based BullMQ) or in-memory events may be used.
- Event names should follow `<domain>.<entity>.<event>`.
- Consumers must be idempotent.

## Docker Rules

Required compose file:
- `docker-compose.yml`

Required infrastructure:
- PostgreSQL database
- Redis

Do:
- Use Relative Paths (e.g., `/api/...`) on the client-side and set up Next.js rewrites/proxies to forward requests to backend containers. This prevents Network Connection Errors when the application is accessed from different client IP addresses or hostnames.
- Use internal Docker service names (e.g., `http://backend:5000`) for server-to-server or SSR requests instead of `localhost`.
- Delete the stale `.next` cache directory and run a clean build (`docker compose build --no-cache`) whenever environment configurations, ports, or service routing schemas are updated.
- Always run `docker compose restart frontend` after modifying static configurations (such as the Roadmap phase list, metadata files) or locale JSON files in the frontend, preventing Next.js cache desynchronization on WSL2 volumes.

Do not:
- Hide required environment variables.
- Make compose depend on undocumented local machine setup.
- Hardcode absolute API URLs (such as `http://localhost:5000` or `http://127.0.0.1:5000`) in client-side scripts.

## Review Checklist

Before marking a phase or feature done, verify:
- Roadmap updated.
- Progress page updated.
- New visible text has i18n keys in all five languages.
- Theme classes use `themeConfig`.
- New pages use `Layout`.
- New dialogs use shared components.
- Auth-protected API calls use shared axios client.
- Backend service does not share database with another service.
- Docker or environment changes are documented.
- Standard List Page pattern (React Query + Sort + Filter + Trash) followed.
