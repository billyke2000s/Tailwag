# Server deployment preparation

This is a candidate configuration, not a deployed service. Hosting, domains, organisation identity and operator approval of launch policies are outstanding. Do not overwrite an existing service or use real records before the launch checklist passes.

## Target

A maintained Linux server with Docker Engine and Compose v2, PostgreSQL 16, separate public/staff DNS names, TLS via Caddy, private storage and an independently protected off-host backup destination. Choose a host and data-processing terms appropriate to the organisation; no supplier or monthly cost has been agreed. Only 80/443 are exposed; do not publish database or app ports.

```sh
cd platform
cp .env.example .env
chmod 600 .env
# Edit every identity/domain/secret value before proceeding.
docker compose build
docker compose config --quiet
docker compose up -d db
docker compose run --rm public sh scripts/entrypoint.sh python manage.py migrate --noinput
docker compose run --rm public sh scripts/entrypoint.sh python scripts/bootstrap.py
docker compose run --rm public sh scripts/entrypoint.sh python scripts/upgrade-core.py
docker compose up -d
```

Set strong independent SECRET_KEY, ADMIN_PASSWORD and PGPASSWORD; use a password manager. Set real PUBLIC_DOMAIN, STAFF_DOMAIN, STAFF_URL, ALLOWED_HOSTS and ORG_* values. Leave PUBLIC_LAUNCH=false until organisational checks pass. The flag gates required identity configuration, not public network reachability: keep staging behind access restrictions. Bootstrap is EMPTY-database-only. After first login enrol TOTP; remove bootstrap ADMIN_PASSWORD from the service environment after securely recording recovery procedures. Do not remove the permanent SECRET_KEY.

Set DNS to the host and permit TLS issuance before opening traffic. Confirm both sites, redirects, cookie security, staff origin rejection, private data boundaries, real upload controls and health. Health checks only prove basic database access. Staff sessions require one worker; do not increase staff worker count. Database/media, receipt metadata and cache are private.

## External configuration

NOTIFICATIONS_ENABLED defaults false. Enable it only after testing actual delivery and failure/reconciliation handling. SMTP_* needs a provider account, authenticated sender, TLS and verified test delivery/failure handling. The public confirmation is an on-screen receipt, not proof of sent email. Donation links appear only when DONATE_URL points to a verified HTTPS provider; no integrated payment webhook is implemented. Native third-party publishing and generic API remain disabled. PDFs require a real UPLOAD_SCANNER executable installed in a custom image and verified reject/error behaviour. Do not enable a scanner setting that accepts every file.

## Upgrade and rollback

Pin and build a reviewed image, read CHANGELOG.md and upstream schema changes, stop writers, take and verify a backup, then run Django migrations and `scripts/upgrade-core.py` against a staging restore first. Run tests and a care/placement smoke test. Production upgrade repeats the reviewed sequence in a maintenance window. Do not start old application code against a newer incompatible schema. Roll back by restoring the matching pre-upgrade database into an isolated replacement stack and deploying the matching old image/config; verify before switching traffic.

## Backup and recovery

Run `sh scripts/backup.sh /absolute/private/backup-dir` from platform/. It stops cooperating app writers, creates a custom-format PostgreSQL dump and checksum, and resumes only services that were running before maintenance, including after a dump failure. Checksums use portable filenames; verify them from the backup directory. The dump contains private records and media: encrypt it and copy it off-host using an independently secured destination. Encryption, scheduling, monitoring and off-host credentials are operator configuration, not built into this script. Record key custody and retention.

Use a separate empty stack and `sh scripts/restore.sh backup.dump --confirm-isolated-empty-database`. Verify the checksum first. Restore is refused when tables already exist. Inspect record counts, representative care/movement histories, media, permissions and pending enquiries. Measure recovery time and loss window. See docs/operations/RECOVERY.md.

The optional Django HSTS-preload warning (security.W021) is explicitly silenced: no domain has been selected or approved for browser preload registration. HTTPS redirects, HSTS and secure cookies remain enabled. Review domain-wide TLS policy before opting into preload; the configuration does not claim registration.
