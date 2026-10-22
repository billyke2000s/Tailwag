# TailWag Care 0.1.0-alpha.1 — operational evaluation candidate

This release adds a separate animal-care platform while preserving the original React/PWA/Android demonstration. It is an **evaluation candidate**, not an approval for live animal welfare operations.

## Included

- Pinned Animal Shelter Manager 52u canonical records and private workflows.
- Responsive Django public website and four real enquiry types feeding the native inbox.
- Explicit public-field/photo approval, fresh availability checks, bounded forms and repeat-submission protection.
- Household assessment/foster-capacity checks and explicit return safeguards on selected placement paths.
- Forced TOTP, zero-prefixed code fix, conservative role templates and native permission-denial status fix.
- Reviewed daily tasks without automatic deletion, anonymisation, hold expiry or publishing.
- PostgreSQL/container/proxy configuration, migrations, health, backup/restore and recovery helpers.
- Research, reuse comparison, feature inventory, staff/admin guides and candid launch gates.

The release workflow requires platform integration/domain tests, browser and role checks, PostgreSQL install/migration/dump-restore, image build, production-settings application smoke and server configuration validation to pass before this release is published. The dated verification record explains their scope. External delivery, payments, real scanner operation and production hosting are not verified by those checks.

## Run and evaluate

Follow DEVELOPMENT.md for a synthetic local demonstration and DEPLOYMENT.md for server preparation. Initial staff credentials are generated privately; TOTP enrolment is required. Do not enter real records before resolving docs/LAUNCH-READINESS.md. No hosted service or operational APK client is included.

The source archive contains platform code and the exact modified ASM source with notices. Verify SHA256SUMS.txt before use. The server image is built locally from the supplied Dockerfile; no production image registry or server has been configured.

## Required before launch

Confirm the actual organisation, council/activity classification, capacities, veterinary and safeguarding procedures, access/retention policies, hosting and recovery ownership. Complete every-role/object permission checks, all lifecycle/import/bulk/interruption paths, scanning, accessibility and external-service verification. The platform is not represented as legally compliant or universally transactional.

## Attribution

Original TailWag idea/files: https://github.com/fpr8653-afk/tailwag. This adaptation is for a friend and does not claim original authorship. Operational foundation: https://github.com/sheltermanager/asm3, GPL-3.0. New platform adaptations are GPL-3.0; this does not relicense unrelated inherited prototype files. See THIRD-PARTY.md and platform/LICENSE.

The existing v1.2.1 debug APK remains an independent prototype release and is not replaced.
