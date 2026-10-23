# Verification record

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

The expanded local suite passed 39 integration tests in 15.642 seconds after adding dated overlap/capacity and native care/correction audit scenarios. The capacity fixture now uses the actual return date for the next placement; the old backdated fixture correctly conflicts. HTTP/browser and PostgreSQL concurrency checks have been added and remain under verification. The official local Chromium download returned a non-ZIP payload; no local browser pass is claimed for this revision. The previous alpha.1 evidence above remains historical and is not substituted for these new checks.
