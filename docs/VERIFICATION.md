# Verification record

Restored source revision checked on 22 October 2026. The workspace reset destroyed earlier unpublished files and screenshots; those earlier results are not substituted for reruns of the reconstructed code.

| Check | Actual result |
|---|---|
| Platform integration suite | 26 passed, 8.228 seconds; isolated SQLite/native database |
| Selected ASM domain suite | 391 passed, 259.742 seconds; reset per test; outbound email stubbed |
| Browser checks | Passed: 12 public route/viewport checks, real enquiry, keyboard skip, persisted TOTP enrolment, staff dashboard at 3 sizes, 40 route/write boundaries across care, veterinary, placement, volunteer and finance roles, foreign Origin rejection; reviewed daily jobs smoke passed |
| Dependency advisory scan | No known vulnerabilities found for the locked Python packages |
| PostgreSQL fresh install/sequence/dump/restore | Passed in [CI run 39767927798](https://github.com/billyke2000s/Tailwag/actions/runs/39767927798) |
| Docker/Compose/Caddy | Image build, configuration expansion and syntax passed in the same CI run |
| Real deployment / SMTP / payments / external scanner | Not performed or configured |

The selected native suite excludes network-dependent and shared-fixture paths. A prior broad run was not wholly green; the published selection is not described as the entire upstream suite. Native tests emit an inherited Python escape-sequence warning. No evidence here proves every native permission, import, placement or clinical workflow safe for real use. See TESTING.md and LAUNCH-READINESS.md.

The first CI run used the earlier 24-test suite and a weaker staff browser assertion. Its infrastructure checks are valid evidence; its staff/TOTP screenshot result is superseded by the stricter test. The local 25-test rerun includes zero-prefixed TOTP enrolment.

The stricter browser rerun inspected the actual enrolled dashboard and fixed footer overflow. Permission denial now returns HTTP 403 rather than the native misleading HTTP 500. The daily-job smoke exposed and fixed an int/string view-version mismatch. Automatic native deletion, audit pruning, anonymisation, hold expiry and publishing are excluded from the reviewed task list. The production-settings container start is a new CI check and remains pending.

Public receipt references are now retained in the native incoming form fields as well as technical metadata, so staff can reconcile an uncertain write using the exact reference. The integration suite checks that link for all four enquiry types.

## Browser-library remediation

A separate review identified the loaded TinyMCE 5.5.1 XSS advisory. Publication was paused. Replacements are pinned in browser-assets.json and corresponding editor source is retained. Sign-in/dashboard/40 selected role boundaries passed with the replacements. Document save/reload and sanitisation checks were added and remain under verification. The four-package advisory inventory reports zero known vulnerabilities; this is not a clearance of every inherited widget or its historical build tooling. See BROWSER-LIBRARIES.md.
