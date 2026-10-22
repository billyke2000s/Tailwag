# Testing

Install DEVELOPMENT.md prerequisites. Tests use generated synthetic data and isolated databases. Never set test database variables to a live system.

```sh
.venv/bin/python platform/scripts/test.py
.venv/bin/python platform/scripts/test-core.py
.venv/bin/python platform/scripts/test-backup.py
npm ci
npx playwright install --with-deps chromium
node platform/scripts/browser-test.mjs
.venv/bin/python -m pip check
.venv/bin/pip install pip-audit==2.10.1
.venv/bin/python -m pip_audit -r platform/requirements.txt
```

The 30 integration tests cover real native incoming forms, repeated submission tokens, CSRF, invalid input, abuse limits, uncertain writes, private publication flags, images, sanctuary adoption guards, assessed foster households, capacity, explicit returns, role templates, safe logs, password policy and legacy hash upgrades, privilege/session stamps, sensitive-report permissions, zero-prefixed TOTP and SQLite restore. The selected 391 native domain tests reset the database per case; outbound email is stubbed. They do not exercise every native feature or prove mail delivery.

Browser automation creates its own databases, enrols TOTP using a generated secret without printing it, verifies a real enquiry, keyboard skip navigation and representative desktop/tablet/phone routes, verifies 41 selected route/write boundaries across five roles, checks actual document save/reload and editor sanitisation, password-change and role-change session revocation, blocks legacy email recovery, runs reviewed daily tasks, then removes runtime secrets. Screenshots contain synthetic data only. `CHROMIUM_PATH` optionally selects an installed browser. Use Playwright's bundled browser in CI.

`platform/scripts/test-postgres.py` requires an EMPTY PostgreSQL database whose name ends `_test`, PostgreSQL client tools and a user able to create/drop the isolated restore database. It checks fresh migration/bootstrap, sequence allocation, real submissions and dump/restore. It refuses a pre-existing `tailwag_restore_test` database.

The platform workflow additionally checks container build, fresh production-settings application startup, Compose expansion and Caddy syntax. These are deployment preparation, not evidence of a running production server. See docs/VERIFICATION.md for actual results and docs/LAUNCH-READINESS.md for unverified workflows.

Prototype checks remain `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`. Android compile/signing belongs to the independent APK workflow.

The backup-wrapper test stubs Docker to exercise successful dumps, dump failure, pre-existing stopped services, private file permissions and portable checksums. It does not claim a live backup or replace the PostgreSQL/off-host restoration drills.
