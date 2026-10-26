# TailWag Care 0.1.0-alpha.5 — foster workspace evaluation update

This evaluation candidate adds a separate foster-carer workspace on the canonical staff authentication and operational records. It is not approval for live organisational use. The independent prototype APK is unchanged.

- Recheck actual household placements for every animal/photo/task request; reject future, returned, deceased and conflicting placements.
- Keep carer accounts out of native staff pages, general searches, reports, exports and documents. Persistent account markers prevent role removal from turning a carer into a staff login.
- Share only minimal identity/photo information and diary instructions explicitly assigned to the individual username.
- Save attributed observations as canonical animal logs plus staff review tasks, with transactional receipts that reconcile repeated submissions.
- Add own-account authenticator enrolment/password changes, CSRF, script-free pages and responsive layouts.
- Correct the animal link on new clinical correction review tasks. Earlier alpha.3/alpha.4 tasks require explicit administrator review; no history is silently rewritten.

**Upgrade changes the database:** versioned technical extension migrations add receipt and portal-account marker tables. Back up, stop writers, run `scripts/upgrade-core.py` with the application environment, and rehearse restoration before enabling the optional feature. Backups must retain extension metadata. Follow docs/FOSTER-PORTAL.md for account/reviewer setup. Existing role maps and users are not automatically broadened; `FOSTER_PORTAL_ENABLED` defaults to false.

Publication requires the full CI run to pass. Verification outcomes and environmental limits belong in docs/VERIFICATION.md. Organisational/council approval, complete native role/object/import/upload/clinical/signature workflows, hosting/providers and encrypted off-host recovery remain launch gates. No live deployment, email delivery, payment or clinical acceptance is claimed.

Original TailWag idea/files: https://github.com/fpr8653-afk/tailwag. This adaptation is for a friend and claims no original authorship. Canonical foundation: https://github.com/sheltermanager/asm3; preserve THIRD-PARTY.md and platform/LICENSE obligations.
