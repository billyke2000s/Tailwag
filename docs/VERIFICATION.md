# Verification record

Restored source revision checked on 22 October 2026. The workspace reset destroyed earlier unpublished files and screenshots; those earlier results are not substituted for reruns of the reconstructed code.

| Check | Actual result |
|---|---|
| Platform integration suite | 25 passed, 7.309 seconds; isolated SQLite/native database |
| Selected ASM domain suite | 391 passed, 256.472 seconds; reset per test; outbound email stubbed |
| Browser checks | Public checks passed; stricter TOTP persistence check added after screenshot review; actual staff dashboard overflow under repair |
| Dependency advisory scan | No known vulnerabilities found for the locked Python packages |
| PostgreSQL fresh install/sequence/dump/restore | Passed in [CI run 39767927798](https://github.com/billyke2000s/Tailwag/actions/runs/39767927798) |
| Docker/Compose/Caddy | Image build, configuration expansion and syntax passed in the same CI run |
| Real deployment / SMTP / payments / external scanner | Not performed or configured |

The selected native suite excludes network-dependent and shared-fixture paths. A prior broad run was not wholly green; the published selection is not described as the entire upstream suite. Native tests emit an inherited Python escape-sequence warning. No evidence here proves every native permission, import, placement or clinical workflow safe for real use. See TESTING.md and LAUNCH-READINESS.md.

The first CI run used the earlier 24-test suite and a weaker staff browser assertion. Its infrastructure checks are valid evidence; its staff/TOTP screenshot result is superseded by the stricter test. The local 25-test rerun includes zero-prefixed TOTP enrolment.
