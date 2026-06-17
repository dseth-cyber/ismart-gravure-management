#!/usr/bin/env bash
# Trivy container scan — local utility
# Usage: ./scripts/trivy-scan.sh [image-tag]
# If no tag given, scans all project images built from compose.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

IMAGES=(
  "gravure-backend:latest"
  "gravure-frontend:latest"
)

if [ $# -ge 1 ]; then
  IMAGES=("$1")
fi

fail=0
for img in "${IMAGES[@]}"; do
  echo -e "${YELLOW}Scanning ${img}…${NC}"
  docker pull --quiet "localhost/${img}" 2>/dev/null || true

  if docker image inspect "$img" &>/dev/null; then
    trivy image \
      --severity HIGH,CRITICAL \
      --exit-code 1 \
      --no-progress \
      --format table \
      "$img" && rc=$? || rc=$?
    if [ $rc -ne 0 ]; then
      echo -e "${RED}✗ ${img} — vulnerabilities found${NC}"
      fail=1
    else
      echo -e "${GREEN}✓ ${img} — clean${NC}"
    fi
  else
    echo -e "${RED}Image ${img} not found — build first with 'docker compose build'${NC}"
    fail=1
  fi
done

exit $fail
