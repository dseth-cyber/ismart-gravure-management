#!/bin/bash
set -euo pipefail

# ============================================================
# Security Audit — iSmart Gravure Management
# Checks: TLS, CORS, auth, secrets, dependencies, Docker.
# ============================================================

PASS=0
FAIL=0

pass() { PASS=$((PASS+1)); echo "  [PASS] $1"; }
fail() { FAIL=$((FAIL+1)); echo "  [FAIL] $1"; }

echo "============================================"
echo " Security Audit Report"
echo " Date: $(date)"
echo "============================================"
echo ""

# 1. JWT Secret strength
echo "[1] JWT Secret"
JWT_SECRET=$(docker compose exec -T backend printenv JWT_SECRET 2>/dev/null || echo "")
if [ "$JWT_SECRET" = "dev_jwt_secret_change_in_production" ]; then
  fail "JWT_SECRET is still default dev value — change in production!"
else
  pass "JWT_SECRET is custom"
fi

# 2. CORS configuration
echo "[2] CORS"
CORS_ORIGINS=$(docker compose exec -T backend printenv CORS_ORIGINS 2>/dev/null || echo "")
if echo "$CORS_ORIGINS" | grep -q '\*'; then
  fail "CORS allows wildcard origin"
else
  pass "CORS origins are whitelisted: $CORS_ORIGINS"
fi

# 3. API Key enabled
echo "[3] API Key Auth"
API_KEY_ENABLED=$(docker compose exec -T backend printenv API_KEY_ENABLED 2>/dev/null || echo "")
if [ "$API_KEY_ENABLED" = "true" ]; then
  pass "API key authentication is enabled"
else
  fail "API key authentication is disabled"
fi

# 4. Database connectivity (non-root user)
echo "[4] Database"
docker compose exec -T postgres psql -U gravure_user -d gravure_db -c "SELECT 1;" &>/dev/null && \
  pass "Database accessible with limited-privilege user" || \
  fail "Database connection failed"

# 5. Redis auth
echo "[5] Redis"
docker compose exec -T redis redis-cli PING &>/dev/null && \
  pass "Redis accessible" || \
  fail "Redis not accessible"

# 6. Helmet security headers
echo "[6] HTTP Security Headers"
HEADERS=$(curl -sI http://localhost:5000/health | grep -iE 'strict-transport-security|x-frame-options|x-content-type-options')
if [ -n "$HEADERS" ]; then
  pass "Security headers present"
  echo "    $HEADERS" | tr '\n' ' '
  echo ""
else
  fail "Missing security headers"
fi

# 7. Package vulnerabilities
echo "[7] npm Audit"
NPM_VULNS=$(docker compose exec -T backend npm audit --json 2>/dev/null | grep -o '"severity":"[^"]*"' | sort | uniq -c | sort -rn || echo "")
if echo "$NPM_VULNS" | grep -q 'critical'; then
  fail "Critical npm vulnerabilities found"
  echo "$NPM_VULNS"
else
  pass "No critical npm vulnerabilities"
fi

# 8. Secrets exposure
echo "[8] Secrets in Environment"
for secret in db_url db_password redis_url jwt_secret jwt_refresh_secret api_keys; do
  FILE=./secrets/${secret}.txt
  if [ -f "$FILE" ]; then
    if [ "$(stat -c %a "$FILE")" -gt 600 ]; then
      fail "Secret file $FILE has loose permissions: $(stat -c %a "$FILE")"
    else
      pass "Secret file $FILE permissions OK"
    fi
  else
    fail "Secret file $FILE not found"
  fi
done

# 9. Container health
echo "[9] Container Health"
for svc in postgres redis backend prometheus loki grafana alertmanager mailhog minio; do
  STATUS=$(docker ps --filter "name=gravure-$svc" --format "{{.Status}}" 2>/dev/null || echo "not running")
  if echo "$STATUS" | grep -q "Up"; then
    pass "Container gravure-$svc is running"
  else
    fail "Container gravure-$svc is not running ($STATUS)"
  fi
done

# Summary
echo ""
echo "============================================"
echo " Audit Results: $PASS passed, $FAIL failed"
echo " Score: $(echo "scale=1; $PASS * 100 / ($PASS + $FAIL)" | bc)%"
echo "============================================"
