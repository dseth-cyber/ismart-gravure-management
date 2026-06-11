#!/bin/bash
set -euo pipefail

# ============================================================
# DR Backup Script — iSmart Gravure Management
# Backups: PostgreSQL, Redis, MinIO data, and config files.
# Retention: daily (7), weekly (4), monthly (3)
# ============================================================

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LABEL="${1:-daily}" # daily | weekly | monthly
RETENTION_DAILY=7
RETENTION_WEEKLY=4
RETENTION_MONTHLY=3

mkdir -p "$BACKUP_DIR/$LABEL"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# PostgreSQL
log "Backing up PostgreSQL..."
docker compose exec -T postgres pg_dump -U gravure_user -d gravure_db --clean --if-exists | gzip > "$BACKUP_DIR/$LABEL/postgres-$TIMESTAMP.sql.gz"
log "PostgreSQL backup done."

# Redis
log "Backing up Redis RDB..."
docker compose exec redis redis-cli SAVE
docker compose cp redis:/data/dump.rdb "$BACKUP_DIR/$LABEL/redis-$TIMESTAMP.rdb"
log "Redis backup done."

# MinIO (all buckets via mc mirror)
log "Backing up MinIO..."
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mirror local/gravure-files "/tmp/minio-backup-$TIMESTAMP"
docker compose cp "minio:/tmp/minio-backup-$TIMESTAMP" "$BACKUP_DIR/$LABEL/minio-$TIMESTAMP"
log "MinIO backup done."

# Config files
log "Backing up config..."
tar czf "$BACKUP_DIR/$LABEL/config-$TIMESTAMP.tar.gz" \
  docker-compose.yml \
  .env \
  monitoring/ \
  secrets/ \
  nginx.conf 2>/dev/null || true
log "Config backup done."

# Retention cleanup
log "Cleaning up old backups..."
case "$LABEL" in
  daily)   keep=$RETENTION_DAILY ;;
  weekly)  keep=$RETENTION_WEEKLY ;;
  monthly) keep=$RETENTION_MONTHLY ;;
esac

ls -1tr "$BACKUP_DIR/$LABEL/" | head -n -$keep | while read -r old; do
  rm -rf "$BACKUP_DIR/$LABEL/$old"
  log "Removed old backup: $old"
done

log "Backup complete: $LABEL"
