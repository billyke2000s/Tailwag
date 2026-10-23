# TailWag Care 0.1.0-alpha.2 — placement integrity evaluation update

This evaluation update fixes date-based placement conflicts and expands care-history verification. It is not an approval for live shelter use. The original prototype APK is independent and unchanged.

## Changes

- Reject overlapping, nested or identical movement intervals even when a return date is supplied.
- Count peak simultaneous foster occupancy, including future-dated stays and returns. A capacity slot becomes available on the recorded return date under the native day-based model.
- Preserve valid non-overlapping historical movements and reject invalid dates or overlap-producing edits before records change.
- Prevent ignored return-date and movement-ID fields from bypassing the dedicated adoption/transfer/foster guards before native side effects.
- Return HTTP 400 for native validation errors rather than a misleading server error.
- Expand integration verification to care administration/correction audit attribution and dated placements; add simultaneous staff foster requests and PostgreSQL advisory-lock capacity checks.
- Update Brotli to 1.2.1 for the upstream decoder security fix (CVE-2026-111497 / GHSA-9v8h-qqgm-4m35).
- Include npm manifests in the operational source archive so its browser verification dependencies can be installed.

Publication requires the platform CI pipeline, including browser, database, server and extracted-package checks, to pass. See docs/VERIFICATION.md for dated evidence and limits.

## Installation and upgrades

Follow DEVELOPMENT.md or DEPLOYMENT.md. No new schema migration is introduced by this update. Back up existing records and rehearse against an isolated staging restore. Existing movements are not rewritten or deleted. Invalid legacy overlaps may require attributed correction before a movement can be edited; review records rather than deleting history to bypass validation.

## Remaining launch gates

The native date model is day-based; intraday room/enclosure occupancy and compatibility remain separate requirements. These checks cover the reviewed staff writer boundary and selected form paths, not every CSV/import/bulk path or atomic recovery of all native multi-statement writes. Direct database changes and unreviewed integrations can bypass safeguards. Organisation/council applicability, clinical and privacy SOPs, complete object/permission acceptance, accessibility, providers, hosting and off-host recovery remain outstanding.

Original TailWag idea/files: https://github.com/fpr8653-afk/tailwag. This adaptation is for a friend and claims no original authorship. Canonical operational foundation: https://github.com/sheltermanager/asm3. Licence and corresponding-source obligations are recorded in THIRD-PARTY.md and platform/LICENSE.

Dependency source checked 23 October 2026: [Google Brotli 1.2.1 release](https://github.com/google/brotli/releases/tag/v1.2.1). The dependency audit blocked the earlier candidate; no audit exception was added.
