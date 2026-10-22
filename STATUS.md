# Delivery status

Updated 22 October 2026. Operational work is on `feature/shelter-platform`; main and the v1.2.1 prototype/APK remain intact.

| Capability | State | Evidence / next gate |
|---|---|---|
| Canonical animal/person/care/movement backend | Adopted pinned ASM | Selected domain tests; full organisation workflows still needed |
| Public site and four enquiry types | Implemented | Integration tests; browser checks passed |
| Public privacy projection and fresh eligibility | Implemented | Flags/private-comment/image tests |
| TOTP and staff application | Implemented | Persisted enrolment, real document save/reload and password-change session revocation passed; broader account recovery review required |
| Conservative role templates | Implemented, unassigned | 41 selected boundaries across five roles passed; full object/endpoint matrix still required |
| Foster/sanctuary safeguards | Implemented selected paths | Tests pass; alternate/bulk/import paths still open |
| Server image, proxy, PG and jobs | Prepared | PG install/restore, image build, Compose and Caddy passed in CI |
| Backup and administrator recovery | Implemented scripts | Local SQLite restore passed; PG dump/restore passed in CI; real off-host drill pending |
| Email, donation provider and PDF scanner | External configuration required | No real delivery/payment/scanning claim |
| Real-world launch | Blocked | docs/LAUNCH-READINESS.md |

Confirmed scope: England, dogs/cats, mixed rescue/foster/sanctuary, no host selected. Local council, organisation identity, activity classification and real capacity are unresolved. The implementation must not be labelled production-ready until the evidence gaps close.
