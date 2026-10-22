#!/bin/sh
set -eu
python scripts/configure.py
case "${1:-public}" in
public) exec gunicorn --bind 0.0.0.0:8000 --workers 2 --threads 4 --timeout 60 --error-logfile - shelter.wsgi:application ;;
staff) exec gunicorn --bind 0.0.0.0:5000 --workers 1 --threads 4 --timeout 90 --error-logfile - staff_wsgi:application ;;
jobs) exec python scripts/worker.py ;;
*) exec "$@" ;;
esac
