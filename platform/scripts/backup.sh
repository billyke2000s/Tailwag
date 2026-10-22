#!/bin/sh
set -eu
umask 077
[ "$#" -eq 1 ] || { echo 'Usage: sh scripts/backup.sh /absolute/private/backup-dir' >&2; exit 2; }
case "$1" in /*) ;; *) exit 2;; esac
mkdir -p "$1"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
running=$(docker compose ps --status running --services public staff jobs)
resume() {
    # Only resume writers that were running when maintenance began.
    if [ -n "$running" ]; then docker compose start $running >/dev/null; fi
}
trap resume EXIT
trap 'exit 130' INT
trap 'exit 143' HUP TERM
docker compose stop public staff jobs
file="$1/care-$stamp.dump"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$file.partial"
mv "$file.partial" "$file"
(cd "$1" && sha256sum "care-$stamp.dump" > "care-$stamp.dump.sha256")
echo "Backup written: $file; encrypt and copy off-host, then test restore"
