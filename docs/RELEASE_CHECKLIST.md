# Release Checklist & Deployment Guide

This checklist details the steps required to deploy the iSmart Gravure Management System to staging and production environments.

---

## 1. Pre-Deployment Staging Checks
- [ ] Run type compilation checks across the codebase:
  ```bash
  npx tsc --noEmit (in /frontend)
  npm run build (in /backend)
  ```
- [ ] Ensure local Docker stack boots cleanly:
  ```bash
  docker compose up --build -d
  ```
- [ ] Run the E2E automated smoke test suite:
  ```bash
  docker compose exec backend npm run test:smoke
  ```

---

## 2. Production Environment Variables Configuration
Configure the following variables in the production orchestrator (e.g. Kubernetes, AWS ECS, or Docker Compose):

### Backend Container (`gravure-backend-api`)
*   `PORT`: `5000` (internal API listener port)
*   `NODE_ENV`: `production` (enforces JSON structured logs and production optimizations)
*   `DATABASE_URL`: `postgresql://<user>:<password>@<db-host>:<db-port>/<db-name>?schema=public`
*   `REDIS_URL`: `redis://<redis-host>:<redis-port>`
*   `JWT_SECRET`: A secure, random 256-bit key
*   `JWT_EXPIRES_IN`: `24h` or `12h`

### Frontend Container (`gravure-frontend-app`)
*   `NODE_ENV`: `production`
*   No direct database credentials should be exposed to the client.

---

## 3. Docker Build & Registry Operations
For production, build the optimized multi-stage release target images:

- [ ] Build and tag the frontend runner image:
  ```bash
  docker build --target runner -t gravure-frontend:latest ./frontend
  ```
- [ ] Build and tag the backend production image:
  ```bash
  docker build -t gravure-backend:latest ./backend
  ```
- [ ] Push images to private container registry:
  ```bash
  docker tag gravure-frontend:latest registry.gravure.corp/gravure-frontend:v1.0.0
  docker tag gravure-backend:latest registry.gravure.corp/gravure-backend:v1.0.0
  docker push registry.gravure.corp/gravure-frontend:v1.0.0
  docker push registry.gravure.corp/gravure-backend:v1.0.0
  ```

---

## 4. Production Database Migrations & Seeding
Apply database schema migrations and initial configurations:

- [ ] Apply pending database schema migrations:
  ```bash
  docker compose exec backend npx prisma migrate deploy
  ```
- [ ] (Initial Release Only) Seed master admin accounts and parameters:
  ```bash
  docker compose exec backend npx prisma db seed
  ```

---

## 5. Post-Release Verification & Sanity Checks
- [ ] Query `/health` endpoint to verify database and Redis status are `connected`:
  ```bash
  curl -s https://api.gravure.corp/health
  ```
- [ ] Verify HTTP response headers return the unique tracing key:
  `x-correlation-id`
- [ ] Check container runtime logs to confirm JSON structured logs are generated:
  ```bash
  docker logs --tail=50 gravure-backend-api
  ```
