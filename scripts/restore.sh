#!/bin/bash
# AI Discover Tunisia — Restore Script
# Usage: ./scripts/restore.sh <backup_file.sql.gz>

set -euo pipefail

DB_CONTAINER="aidt-postgres"
DB_NAME="aidt_db"
DB_USER="aidt_user"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date +"%Y-%m-%d %H:%M:%S")] $*"
}

if [ $# -lt 1 ]; then
    log "${RED}Usage: $0 <backup_file.sql.gz>${NC}"
    echo
    echo "Available backups:"
    ls -lh /opt/ai-discover-tunisia/backups/db_*.sql.gz 2>/dev/null || echo "  (none)"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    log "${RED}File not found: $BACKUP_FILE${NC}"
    exit 1
fi

log "================================"
log "${YELLOW}⚠️  RESTORE WARNING${NC}"
log "================================"
log "This will REPLACE the current database:"
log "  Container: ${DB_CONTAINER}"
log "  Database:  ${DB_NAME}"
log "  From:      $(basename "$BACKUP_FILE")"
log "================================"
read -p "Are you sure? Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log "Aborted."
    exit 0
fi

log "Dropping and recreating database..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" 
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

log "Restoring from ${BACKUP_FILE}..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

log "${GREEN}✅ Restore complete${NC}"
log "Restart backend to reconnect:"
log "  sudo env PATH=\$PATH:/usr/bin pm2 restart aidt-backend"
