# Verification record

Latest evaluation release: [care-v0.1.0-alpha.3](https://github.com/billyke2000s/Tailwag/releases/tag/care-v0.1.0-alpha.3), verified in the 24 October section below.

## 22 October 2026 — historical alpha.1 evidence

Restored source revision checked on 22 October 2026. The workspace reset destroyed earlier unpublished files and screenshots; those earlier results are not substituted for reruns of the reconstructed code.

| Check | Actual result |
|---|---|
| Platform integration suite | 30 passed, 8.933 seconds; isolated SQLite/native database |
| Selected ASM domain suite | 391 passed, 254.533 seconds; reset per test; outbound email stubbed |
| Browser checks | Passed: 12 public route/viewport checks, real enquiry, keyboard skip, persisted TOTP enrolment, staff dashboard at 3 sizes, 41 selected route/write boundaries across care, veterinary, placement, volunteer and finance roles, foreign Origin rejection; real document save/reload, basic editor sanitisation, password-change session revocation and blocked legacy recovery; reviewed daily jobs smoke passed |
| Dependency advisory scan | No known vulnerabilities found for the locked Python packages |
| PostgreSQL fresh install/sequence/dump/restore | Passed in [CI run 39767927798](https://github.com/billyke2000s/Tailwag/actions/runs/39767927798) |
| Docker/Compose/Caddy | Image build, configuration expansion and syntax passed in the same CI run |
| Real deployment / SMTP / payments / external scanner | Not performed or configured |

The selected native suite excludes network-dependent and shared-fixture paths. A prior broad run was not wholly green; the published selection is not described as the entire upstream suite. Native tests emit an inherited Python escape-sequence warning. No evidence here proves every native permission, import, placement or clinical workflow safe for real use. See TESTING.md and LAUNCH-READINESS.md.

The first CI run used the earlier 24-test suite and a weaker staff browser assertion. Its infrastructure checks are valid evidence; its staff/TOTP screenshot result is superseded by the stricter test. The local 25-test rerun includes zero-prefixed TOTP enrolment.

The stricter browser rerun inspected the actual enrolled dashboard and fixed footer overflow. Permission denial now returns HTTP 403 rather than the native misleading HTTP 500. The daily-job smoke exposed and fixed an int/string view-version mismatch. Automatic native deletion, audit pruning, anonymisation, hold expiry and publishing are excluded from the reviewed task list. The production-settings container start passed in [CI run 39821015852](https://github.com/billyke2000s/Tailwag/actions/runs/39821015852): fresh migrations/bootstrap/upgrade and daily jobs, Django deployment checks, reachable public health and staff login, and no seeded animals. This is a disposable runner test, not a real hosting deployment.

Public receipt references are now retained in the native incoming form fields as well as technical metadata, so staff can reconcile an uncertain write using the exact reference. The integration suite checks that link for all four enquiry types.

## Browser-library remediation

A separate review identified the loaded TinyMCE 5.5.1 XSS advisory. Publication was paused. Replacements are pinned in browser-assets.json and corresponding editor source is retained. Sign-in/dashboard/40 selected role boundaries passed with the replacements. Document save/reload and basic sanitisation checks passed with TinyMCE 8.10.0. The four-package advisory inventory reports zero known vulnerabilities; this is not a clearance of every inherited widget or its historical build tooling. See BROWSER-LIBRARIES.md.

## Account and report hardening

Thirty integration checks passed after adding password policy, legacy-hash upgrade, sensitive foster-report ACL and canonical privilege-stamp tests. The selected 391 native checks passed in 254.533 seconds after password hashing changes. The browser rerun confirmed password-change revocation and legacy recovery rejection. The subsequent browser rerun passed actual role-change session revocation as well. Canonical role assignments/maps and account access restrictions are included in the session stamp. No email delivery, private identity recovery or complete permission-matrix claim follows from these checks.

Fresh source archive extraction also passed locally: Django metadata migrations, empty native bootstrap/upgrade, repeat preparation and explicitly synthetic seeding. The archive includes source/notices and excludes Git metadata, runtime records, secrets and generated schema databases. CI now repeats the extracted-source setup before publishing assets.

Backup maintenance review fixed unconditional service restart and non-portable checksum paths. Synthetic Docker-stub checks passed for success, dump failure, originally stopped services, permissions and checksum verification. Actual off-host backup restoration remains unperformed.

A separate isolated synthetic care rehearsal passed linked one-off scheduling, administration, attributed correction, audit actors and preservation of one treatment record. This was a direct native adapter rehearsal, not a full browser/clinical approval or duplicate-stock/concurrency test.

## Published evaluation checkpoint

[CI run 39823603416](https://github.com/billyke2000s/Tailwag/actions/runs/39823603416) passed at source checkpoint `6f1e25fc84b7eb6090c78c518b0fbc898d6c47f5`: 30 integration tests (11.741 seconds), 391 selected native tests (208.385 seconds), backup-wrapper checks, both scoped dependency audits, PostgreSQL install/migration/dump-restore, browser workflows and 41 selected role boundaries, image build, production-settings startup, Compose/Caddy validation and fresh source archive extraction/setup. These results supersede the earlier pending-status note.

The workflow published [care-v0.1.0-alpha.1](https://github.com/billyke2000s/Tailwag/releases/tag/care-v0.1.0-alpha.1) as a prerelease with the operational source archive and SHA256SUMS.txt. The release/tag remains pinned to its verified source revision. Subsequent documentation updates do not change that immutable checkpoint. This is an evaluation release, not an operational deployment or a completed launch approval.

A separate local synthetic backup SIGTERM rehearsal also passed: previously running writers resumed and no completed dump was exposed. It does not replace an encrypted off-host restore drill.

## 23 October 2026 — placement integrity work

The expanded local suite passed 39 integration tests in 15.642 seconds after adding dated overlap/capacity and native care/correction audit scenarios. The capacity fixture now uses the actual return date for the next placement; the old backdated fixture correctly conflicts. HTTP/browser and PostgreSQL concurrency checks were added; their later CI results are recorded below. The official local Chromium download returned a non-ZIP payload; no local browser pass is claimed for this revision. The previous alpha.1 evidence above remains historical and is not substituted for these new checks.

The selected 391 native domain tests also passed locally (237.835 seconds). CI run [40037223011](https://github.com/billyke2000s/Tailwag/actions/runs/40037223011) stopped at its locked Python audit: Brotli 1.2.0 was affected by PYSEC-2026-4322 / GHSA-9v8h-qqgm-4m35. Later checks and release publication were skipped. The pin was upgraded to 1.2.1, matching the [upstream security release](https://github.com/google/brotli/releases/tag/v1.2.1), checked 23 October 2026. No vulnerability suppression was introduced.

After upgrading Brotli, the local locked-requirements audit reported no known vulnerabilities, `pip check` reported no broken requirements, and all 39 integration tests passed again (15.266 seconds). This is an advisory scan of the locked Python requirements, not a complete security assessment. The later CI results below supersede the earlier pending state.


### Published alpha.2 evidence

[Push/release run 40038283533](https://github.com/billyke2000s/Tailwag/actions/runs/40038283533) passed at `699a0f21ccb7964a19354672c40b5519ba094ca4`. [PR run 40038288948](https://github.com/billyke2000s/Tailwag/actions/runs/40038288948) also passed. PR #17 merged that implementation into main.

| Check | Actual result in the push run |
|---|---|
| Integration | 39 passed, 28.832 seconds |
| Selected native domain suite | 391 passed, 240.609 seconds; isolated fixtures, email stubbed |
| Advisory scans | Locked Python requirements: no known vulnerabilities; browser inventory audit passed |
| Staff/browser | 12 public route/viewport checks, enquiry, keyboard skip, TOTP, 3 staff sizes, 41 selected role boundaries, document save/sanitisation, password/privilege session revocation and foreign-origin rejection passed |
| Placement concurrency/history | Two simultaneous staff foster requests for one slot: one success and one HTTP 400; ignored adoption fields rejected without changing the existing foster; explicit return freed capacity with history retained |
| PostgreSQL | Fresh install/migration, distinct submission IDs, one-slot concurrent foster guard and dump/restore passed; restored movement retained |
| Backup wrapper | Synthetic success/failure/state/permissions/checksum checks passed; no live backup claim |
| Server/package | Image build, fresh production-settings startup with no seed animals, Compose/Caddy and setup from the extracted source archive passed |
| External operations | No live deployment, SMTP delivery, payment, scanner or encrypted off-host restore performed |

The workflow published alpha.2 as a prerelease with the source archive and SHA256SUMS.txt. GitHub reports source asset SHA-256 `a0cd3aff85e24d6aa416288340cf3e4de9cd7a4e0172e47b399d63c905e8de59`. The immutable tag targets the verified implementation; subsequent documentation updates leave that checkpoint intact. The independent prototype checks passed too; its APK release was not replaced.

This closes the selected dated-placement verification, not the complete launch matrix. Native import/bulk paths, intraday premises/compatibility, interrupted multi-statement operations, full object/role isolation and organisational acceptance remain open in LAUNCH-READINESS.md.


## 24 October 2026 — care recording work

The local expanded integration suite passed 51 tests in 25.801 seconds, including 12 new care workflow tests covering three clinical record types, repeated completions, rollback after stock/batch failures, stale corrections, attributed clearing and mobile repeats. The first run exposed an incorrect assumption that the native audit table has an ID; snapshots now use the audit-row count and canonical row state. No failed result was treated as a pass. Local Chromium installation again returned a non-ZIP archive, so new browser evidence remains pending CI. PostgreSQL/browser concurrency, responsive correction dialogs and deployment checks have been added; their outcomes are not yet claimed.

The expanded local rerun passed 53 tests in 26.109 seconds after adding linked-animal access and veterinary template checks. The selected 391 native tests passed (226.088 seconds). `pip check` passed. Browser installation failed with a non-ZIP Chromium payload; CI remains the pending source of new rendered-screen evidence. Initial test collection also required importing the canonical adapter before native modules; this was corrected before the successful runs.

CI [40118043387](https://github.com/billyke2000s/Tailwag/actions/runs/40118043387) passed 53 integration tests, 391 selected native tests and PostgreSQL concurrency/rollback/correction/restore checks, then failed the real correction-dialog save. The native widget submits HH:MM:SS; the new validator had only accepted HH:MM. The validator now accepts validated optional seconds without dropping them, and a regression scenario covers completion plus correction. Publication was skipped. New browser/deployment results remain pending the rerun.

After the time-field correction and transactional care-plan review task, all 55 local integration tests passed in 27.481 seconds. Clearing does not infer permission to reactivate a regimen; it creates a native task assigned to the correcting actor, without immediate email. An injected task-write failure rolls back the care correction. The locked Python advisory scan again reported no known vulnerabilities. These are local results; browser/PG/deployment outcomes for this revision remain pending.


### Published alpha.3 evidence

[Push/release run 40119009905](https://github.com/billyke2000s/Tailwag/actions/runs/40119009905) passed at `0d09c98747722c91a6786c1abab10e030c10a9f8`; PR #18 merged it into main. Actual results: 55 integration tests (34.567 seconds), 391 selected native tests (188.769 seconds), dependency audits, PG concurrency/rollback/correction/dump-restore, real care/correction dialogs at three sizes, competing completion/stock requests, stale snapshot rejection, an allowed assigned-animal clinical write and denied out-of-filter write, existing 41 role boundaries/TOTP/editor/session checks, backup wrapper, image/production-start/configuration and extracted-package setup. No failed check was suppressed. Local browser installation remained unavailable; actual browser evidence comes from CI.

The workflow published alpha.3 as an evaluation prerelease with source archive and SHA256SUMS.txt. GitHub reports source SHA-256 `44a7f831cffeaaf759f1fa21bb620cfdffc1ca8fd0703f4aa1210b759e75a318`. It is not a live deployment, a complete clinical/access audit or organisational acceptance. The existing APK remains independent.


### Document boundary work — pending release verification

The first 66-test local suite passed (36.734 seconds); after adding print/hyperlink checks the expanded suite passed 68 tests (40.621 seconds). Tests generated real PDFs and checked text/geometry/raster output, rejected local/network/CSS/relative/SVG/attachment resources, observed no HTTP request at the synthetic local server, and checked secret omission and error limits. A synthetic one-page export was rendered to PNG and visually inspected: headings, notice, table, body and footer were readable without overlap or clipping. No real record or legal agreement was used. Tagged output and the added application/browser/container checks are still under verification for the final revision.

The final local 68-test rerun passed in 37.882 seconds with tagged PDF output and the final 11pt default. Poppler confirmed readable text, landscape geometry and tagged output. Backup-wrapper checks, compilation, JavaScript and shell syntax and whitespace checks passed. New editor/print-preview and container-font checks remain pending CI.
