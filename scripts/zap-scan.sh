#!/usr/bin/env bash
# OWASP ZAP DAST scan — local utility
# Usage: ./scripts/zap-scan.sh [target-url]
# Default target: http://localhost:5000

set -euo pipefail

TARGET="${1:-http://localhost:5000}"
REPORT_DIR="./zap-reports"
mkdir -p "$REPORT_DIR"

echo "Starting ZAP DAST scan against ${TARGET}…"

docker run --rm \
  -v "${PWD}/${REPORT_DIR}:/zap/wrk" \
  -v "${PWD}/zap/rules.tsv:/zap/rules.tsv:ro" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-full-scan.py \
  -t "$TARGET" \
  -r zap-report.html \
  -I \
  -T 60 \
  -z "-config globalexcludeurl.url_list.url\(0\).regex='.*/health.*'" \
  -l PASS

echo "Report saved to ${REPORT_DIR}/zap-report.html"
