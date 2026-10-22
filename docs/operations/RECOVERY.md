# Recovery runbook

1. Protect animal care continuity using the organisation's approved offline handover/emergency procedure. Record changes made during outage for reconciliation.
2. Restrict traffic and preserve private evidence. Identify application revision, schema revision, latest backup and job/receipt uncertainty. Do not overwrite the original database.
3. Verify the backup checksum and decrypt in an access-controlled location. Restore into an isolated EMPTY replacement database using the matching application revision and configuration. The restore helper refuses existing tables.
4. Check animals, people, care administrations, movements/returns, private documents/media, permissions, enquiries and audit histories. Compare agreed counts and the latest known timestamps. Measure the actual loss window and recovery time.
5. Reconcile uncertain writes and care changes recorded during outage with an authorised staff member. Do not blindly rerun medication administrations, placements, payment actions or notifications.
6. Test login/TOTP, public-private access and health before switching traffic. Record who approved recovery and when. Keep the original evidence protected for investigation and retention review.

For lost administrator TOTP, use scripts/recover-admin.py only from a trusted administrative environment with RECOVER_USERNAME and a new strong NEW_PASSWORD provided privately through the environment. It resets that account's TOTP and records the recovery; enrol again immediately. Never publish the password or secret in a command transcript, issue or screenshot.

Backups need encryption, off-host copies, protected keys, monitoring and periodic restoration. The supplied dump helper alone does not provide those controls or an uptime guarantee.

The public/native email reset endpoints are deliberately disabled. An authorised administrator must verify the requester’s identity under the organisation’s procedure before recovery. Password replacement invalidates the account’s existing sessions on their next protected request. Supply the replacement passphrase through an approved private channel, require TOTP re-enrolment and review the recovery audit. Never use a public issue or email containing a plaintext password as the recovery record.
