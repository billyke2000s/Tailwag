# TailWag Care 0.1.0-alpha.3 — care recording evaluation update

This candidate extends the reviewed care completion workflows. It is not approval for real operational use. The independent prototype APK remains unchanged.

## Changes

- Preserve native clinical permissions and check the linked animal boundary before reviewed completion writes. New-install veterinary templates include the reviewed completion flags; existing role maps are not silently broadened.
- Reject repeated/mixed-state care completions before updating records or deducting stock, including reviewed mobile shortcuts.
- Commit treatment/vaccination/test completion, generated follow-ups, stock usage and native audit changes together on the reviewed paths; roll back if a statement or later step fails.
- Require an explicit correction action, reason and current record snapshot. Stale corrections are rejected. Correct one record at a time; normal completion still supports batches.
- Preserve attribution and prior audit history. Clearing an erroneous treatment completion retains its comments and original administrator. It never automatically returns supplies to stock or restarts a treatment plan; it creates an assigned native review task in the same transaction.
- Provide shared responsive care dialogs, retained validation errors and correction defaults from the selected record. Hide stock and follow-up creation during corrections.
- Test repeated requests, negative/invalid/insufficient stock, partial failures and stale snapshots with synthetic data; extend browser and PostgreSQL checks.

## Setup and scope

Follow DEVELOPMENT.md and DEPLOYMENT.md. No new database schema migration is introduced. Back up and rehearse against isolated staging first. External services, actual organisational policies, full access/import/upload/clinical coverage, premises compatibility and off-host recovery remain launch gates.

Transactions apply to the reviewed completion handlers, not every native edit, import, deletion or integration. Other inherited record editors still require review. Corrections do not reconcile inventory automatically; use an attributed stock adjustment after checking physical stock and prior usage. Native optional vaccination metadata semantics and derived animal identifiers require review before clinical acceptance. No treatment instructions or doses are generated.

Publication requires the complete CI pipeline to pass. See docs/VERIFICATION.md for actual evidence and environmental limits.

Original TailWag idea/files: https://github.com/fpr8653-afk/tailwag. This adaptation improves that work for a friend and claims no original authorship. Canonical foundation: https://github.com/sheltermanager/asm3; preserve THIRD-PARTY.md and platform/LICENSE obligations.
