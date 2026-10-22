#!/bin/sh
set -eu
[ "$#" -eq 2 ] && [ "$2" = '--confirm-isolated-empty-database' ] || { echo 'Usage: sh scripts/restore.sh backup.dump --confirm-isolated-empty-database' >&2; exit 2; }
[ -f "$1" ] || exit 2
count=$(docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '\''public'\''"')
[ "$count" = 0 ] || { echo 'Restore refused: database is not empty' >&2; exit 1; }
docker compose exec -T db sh -c 'pg_restore --exit-on-error --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$1"
echo 'Restored; verify histories, media, permissions and care workflows before traffic'
