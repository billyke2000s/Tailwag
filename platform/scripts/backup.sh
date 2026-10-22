#!/bin/sh
set -eu
umask 077
[ "$#" -eq 1 ] || { echo 'Usage: sh scripts/backup.sh /absolute/private/backup-dir' >&2; exit 2; }
case "$1" in /*) ;; *) exit 2;; esac
mkdir -p "$1"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose stop public staff jobs
trap 'docker compose start public staff jobs >/dev/null' EXIT HUP INT TERM
file="$1/care-$stamp.dump"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$file.partial"
mv "$file.partial" "$file"
sha256sum "$file" > "$file.sha256"
echo "Backup written: $file; encrypt and copy off-host, then test restore"
