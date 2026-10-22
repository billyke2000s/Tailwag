#!/bin/sh
# CI-only disposable production-settings smoke test. Never uses a compose deployment.
set -eu
[ "${CI:-}" = true ] || { echo 'Disposable container smoke test is CI-only' >&2; exit 2; }
suffix="${GITHUB_RUN_ID:-local}-$$"
network="tailwag-test-$suffix"; db="tailwag-db-test-$suffix"; public="tailwag-public-test-$suffix"; staff="tailwag-staff-test-$suffix"; volume="tailwag-runtime-test-$suffix"
cleanup() { docker rm -f "$public" "$staff" "$db" >/dev/null 2>&1 || true; docker volume rm "$volume" >/dev/null 2>&1 || true; docker network rm "$network" >/dev/null 2>&1 || true; }
trap cleanup EXIT HUP INT TERM
docker network create "$network" >/dev/null
docker run -d --name "$db" --network "$network" -e POSTGRES_DB=care_test -e POSTGRES_USER=care_test -e POSTGRES_PASSWORD=synthetic-test-only postgres:16 >/dev/null
ready=false
for attempt in $(seq 1 40); do if docker exec "$db" pg_isready -U care_test -d care_test >/dev/null 2>&1; then ready=true; break; fi; sleep 1; done
[ "$ready" = true ] || exit 1
# Explicit test credentials; no operational secrets or records are involved.
common() { docker run --rm --network "$network" -v "$volume:/app/runtime" -e PGHOST="$db" -e PGDATABASE=care_test -e PGUSER=care_test -e PGPASSWORD=synthetic-test-only -e SECRET_KEY=synthetic-ci-deployment-key-not-for-real-use-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ -e ADMIN_PASSWORD=synthetic-ci-password-not-for-real-use -e STAFF_URL=https://team.example.invalid -e PUBLIC_DOMAIN=care.example.invalid -e ALLOWED_HOSTS=care.example.invalid tailwag-care:ci sh scripts/entrypoint.sh "$@"; }
common python manage.py migrate --noinput
common python scripts/bootstrap.py
common python scripts/upgrade-core.py
common python scripts/run-jobs.py
common python manage.py check --deploy --fail-level WARNING
for name in "$public" "$staff"; do
 case "$name" in "$public") mode=public;; *) mode=staff;; esac
 docker run -d --name "$name" --network "$network" -v "$volume:/app/runtime" -e PGHOST="$db" -e PGDATABASE=care_test -e PGUSER=care_test -e PGPASSWORD=synthetic-test-only -e SECRET_KEY=synthetic-ci-deployment-key-not-for-real-use-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ -e STAFF_URL=https://team.example.invalid -e PUBLIC_DOMAIN=care.example.invalid -e ALLOWED_HOSTS=care.example.invalid tailwag-care:ci sh scripts/entrypoint.sh "$mode" >/dev/null
done
sleep 3
docker exec "$public" python scripts/healthcheck.py
docker exec "$staff" python -c 'import urllib.request,urllib.error; r=urllib.request.urlopen("http://localhost:5000/login",timeout=10); assert r.status==200; print("Production-settings staff login reachable")'
common python -c 'from shelter.core import database; d=database(); assert d.query_int("SELECT COUNT(*) FROM animal")==0; print("Production-settings database remains free of seed animals")'
echo 'Disposable production-settings application smoke passed'
