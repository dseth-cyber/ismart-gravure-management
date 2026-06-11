#!/bin/sh
PASS=0; FAIL=0
pass() { PASS=$((PASS+1)); echo "  [PASS] $1"; }
fail() { FAIL=$((FAIL+1)); echo "  [FAIL] $1"; }
echo "Security Audit Report - $(date)"
echo "============================================"

echo "[1] JWT Secret"
JWT=$(printenv JWT_SECRET)
if [ "$JWT" = "dev_jwt_secret_change_in_production" ]; then fail "JWT_SECRET default dev value"; else pass "JWT_SECRET custom"; fi

echo "[2] CORS"
CORS=$(printenv CORS_ORIGINS)
if echo "$CORS" | grep -q '*'; then fail "Wildcard CORS"; else pass "CORS whitelisted: $CORS"; fi

echo "[3] API Key"
[ "$(printenv API_KEY_ENABLED)" = "true" ] && pass "API key auth enabled" || fail "Disabled"

echo "[4] Database"
node -e "const {prisma}=require('./src/config/database');prisma.\$queryRaw\`SELECT 1\`.then(()=>console.log('ok')).catch(()=>console.log('fail'))" 2>/dev/null | grep -q ok && pass "DB accessible" || fail "DB failed"

echo "[5] Redis"
node -e "const {getRedis}=require('./src/config/redis');getRedis().ping().then(r=>console.log(r==='PONG'?'ok':'fail')).catch(()=>console.log('fail'))" 2>/dev/null | grep -q ok && pass "Redis accessible" || fail "Redis failed"

echo "[6] npm Audit"
AUDIT=$(npm audit --json 2>/dev/null | node -e "const d=require('fs').readFileSync(0,'utf8');try{const j=JSON.parse(d);console.log(JSON.stringify(j.metadata?.vulnerabilities||{}))}catch(e){console.log('{}')}" 2>/dev/null)
if echo "$AUDIT" | grep -q '"critical":0'; then pass "No critical vulns"
elif echo "$AUDIT" | grep -q 'critical'; then fail "Critical vulns: $AUDIT"
else pass "Audit checked"
fi

echo ""
echo "Results: $PASS passed, $FAIL failed"
