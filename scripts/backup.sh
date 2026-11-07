#!/bin/bash
# AI Discover Tunisia — Backup Script

set -euo pipefail

BACKUP_DIR="/opt/ai-discover-tunisia/backups"
DB_CONTAINER="aidt-postgres"
DB_NAME="aidt_db"
DB_USER="aidt_user"
RETENTION_DAYS=7
LOG_FILE="$BACKUP_DIR/backup.log"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $*" | tee -a "$LOG_FILE"
}

log "================================"
log "Starting backup"
log "================================"

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    log "${RED}Container ${DB_CONTAINER} not running${NC}"
    exit 1
fi

DB_FILE="$BACKUP_DIR/db_${TIMESTAMP}.sql.gz"
log "Dumping database..."
if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$DB_FILE"; then
    SIZE=$(du -h "$DB_FILE" | cut -f1)
    log "${GREEN}DB backup: $(basename "$DB_FILE") (${SIZE})${NC}"
else
    log "${RED}DB dump failed${NC}"
    exit 1
fi

ENV_FILE="$BACKUP_DIR/env_${TIMESTAMP}.tar.gz"
log "Backing up .env files..."
if tar -czf "$ENV_FILE" -C /opt/ai-discover-tunisia backend/.env frontend/.env.local 2>/dev/null; then
    SIZE=$(du -h "$ENV_FILE" | cut -f1)
    log "${GREEN}Env backup: $(basename "$ENV_FILE") (${SIZE})${NC}"
    chmod 600 "$ENV_FILE"
else
    log "${YELLOW}Env backup failed${NC}"
fi

log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "env_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

TOTAL_DB=$(find "$BACKUP_DIR" -name "db_*.sql.gz" | wc -l)
TOTAL_ENV=$(find "$BACKUP_DIR" -name "env_*.tar.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "================================"
log "${GREEN}Backup complete${NC}"
log "   DB backups: ${TOTAL_DB} (${TOTAL_SIZE})"
log "   Env backups: ${TOTAL_ENV}"
log "================================"

exit 0
