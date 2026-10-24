# Delivery status

Updated 24 October 2026. The [care-v0.1.0-alpha.3 evaluation prerelease](https://github.com/billyke2000s/Tailwag/releases/tag/care-v0.1.0-alpha.3) is published and PR #18 is merged. The platform is integrated alongside the independent original React/PWA/Android prototype; v1.2.1 remains intact.

| Capability | State | Evidence / next gate |
|---|---|---|
| Canonical animal/person/care/movement backend | Adopted pinned ASM | Reviewed transactional care completion, correction/review tasks and stock protection passed; complete clinical workflow acceptance still needed |
| Public site and four enquiry types | Implemented | Integration tests; browser checks passed |
| Public privacy projection and fresh eligibility | Implemented | Flags/private-comment/image tests |
| TOTP and staff application | Implemented | Persisted enrolment, real document save/reload and password-change session revocation passed; broader account recovery review required |
| Conservative role templates | Implemented, unassigned | 41 selected boundaries across five roles passed; full object/endpoint matrix still required |
| Foster/sanctuary safeguards | Implemented selected paths | Dated overlaps, peak foster capacity, concurrent staff/PG requests and explicit return history passed; alternate/bulk/import paths still open |
| Server image, proxy, PG and jobs | Prepared | PG install/restore, image build, production-settings startup, Compose and Caddy passed in CI |
| Backup and administrator recovery | Implemented scripts | Local SQLite restore passed; PG dump/restore passed in CI; real off-host drill pending |
| Email, donation provider and PDF scanner | External configuration required | No real delivery/payment/scanning claim |
| Real-world launch | Blocked | docs/LAUNCH-READINESS.md |

Confirmed scope: England, dogs/cats, mixed rescue/foster/sanctuary, no host selected. Local council, organisation identity, activity classification and real capacity are unresolved. The implementation must not be labelled production-ready until the evidence gaps close.

Alpha.3 verification: [push/release run 40119009905](https://github.com/billyke2000s/Tailwag/actions/runs/40119009905) passed 55 integration tests, 391 selected native tests, real care/correction/stock and linked-animal browser checks, three correction-dialog sizes, PostgreSQL concurrency/rollback/restore and server/package checks. Existing role maps are preserved; new veterinary templates add reviewed completion flags. Native editor/import/document paths remain under review. See docs/VERIFICATION.md for evidence and limits.
