# Administration

Before onboarding staff, configure organisation/council/contact details, locations and actual capacities, veterinary contacts, species lookups, permitted activities and document templates. Review every default and keep demonstration data out of production. Import only after a tested mapping, duplicate strategy and protected backup.

The Care, Veterinary, Placement, Volunteer and Finance role templates are conservative starting points and are not automatically assigned. Test search, direct URLs, media, reports, exports, writes and ownership boundaries for the actual role before granting it. Foster-only access remains gated. Review disabled/default accounts and periodically review leavers and privileges. Restrict administration and recovery.

Use native audit histories for changes and record corrections with a reason. Archive when history must remain; deletion needs an approved retention/rights process and legal-hold review. Technical metadata pruning in scripts/prune-metadata.py is not an animal/person retention schedule.

Reconcile pending/review public receipts against the Public receipt reference field in native incoming records and their CollationID before deciding whether an enquiry can be retried. Do not delete uncertain receipts to bypass deduplication. Monitor daily-job attempt/success markers and logged errors; investigate before rerunning. Daily jobs deliberately exclude native automatic retention/deletion, hold expiry and publishing. Review those actions manually under approved policies. Configure and test SMTP before enabling workflows that rely on delivery. Native service API and unreviewed publishers remain disabled.

Record system ownership, patch cadence, backup monitoring, incident contacts and access reviews outside public GitHub. Run the deployment and recovery drills in DEPLOYMENT.md with synthetic data first.
