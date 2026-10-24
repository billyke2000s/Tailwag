# Development

Prerequisites: Git, Python 3.12, Node 22.12+, npm; Linux native libraries required by Pillow/WeasyPrint, DejaVu fonts and Poppler utilities (`poppler-utils`) for export tests. PostgreSQL 16 and Docker Compose v2 are needed for server checks. No operational credentials or records belong in a development checkout.

```sh
git clone https://github.com/billyke2000s/Tailwag.git
cd Tailwag
python3 -m venv .venv
.venv/bin/pip install -r platform/requirements.txt
.venv/bin/python platform/scripts/fetch-core.py
.venv/bin/python platform/scripts/dev.py --prepare
.venv/bin/python platform/scripts/dev.py --seed
.venv/bin/python platform/scripts/dev.py
```

Public: http://127.0.0.1:8000. Staff: http://localhost:5000. Use the exact staff hostname because Origin checks use STAFF_URL. `--seed` is optional, refuses a populated animal database, and creates explicitly synthetic dog/cat residents. It does not import original prototype photographs.

Initial user: `care-admin`. The generated password is in ignored `platform/runtime/dev-secrets.json`; view it locally and keep it private. Enrol an authenticator on first login. The runtime configuration, databases and secrets are ignored. Never run `bootstrap.py` on an existing core; it refuses an existing users table. Source fetch and bootstrap need internet only for source/dependencies, not remote executable report installation.

Run verification in TESTING.md before opening a PR. Keep dependencies pinned and review advisories before updating. Add a migration for Django metadata changes; native schema upgrades use `upgrade-core.py`. Do not mutate copied vendor files without adding a repeatable patch. Production settings are described in DEPLOYMENT.md.

The root React/PWA/Android prototype keeps its own `npm ci`, `npm run dev` and build commands. It is not the shelter's canonical backend and must not be connected to live care records casually.

Optional formatting tools: `ruff==0.14.0` for Python and `prettier@3.6.2` for the browser verification script. Format only owned platform code; do not blanket-format the fetched vendor source. The checked patch anchors depend on that source remaining recognisable.

## Candidate source archive

Verify `SHA256SUMS.txt` against the downloaded archive, then extract it into a new directory. The archive includes the exact modified native core, browser assets, corresponding editor source and notices. It omits Git metadata, runtime records and secrets. From the extracted directory:

```sh
python3 -m venv .venv
.venv/bin/pip install -r platform/requirements.txt
.venv/bin/python platform/scripts/dev.py --prepare
.venv/bin/python platform/scripts/dev.py --seed
.venv/bin/python platform/scripts/dev.py
```

Use the included source directly for this local evaluation. `fetch-core.py` verifies Git checkouts and belongs to the repository-clone workflow above. Docker builds deliberately fetch the pinned sources afresh because vendor directories are excluded from the build context; a Docker build still requires network access. The archive contains the operational platform and documentation; use the full repository for the independent React/Android prototype.
