# Security

This branch is an evaluation candidate, not an audited or certified system. See docs/LAUNCH-READINESS.md for known gaps. Do not submit sensitive data in public issues. Until a private security contact is configured, use GitHub's private vulnerability reporting if enabled; otherwise privately contact the repository owner through a verified channel.

Controls include HTTPS production settings, secure HttpOnly sessions, CSRF on public forms, explicit staff Origin checks, forced native TOTP, disabled default guest accounts and unsafe remember-me storage, bounded public input, rate limiting, explicit publication fields and re-encoded public images. Native log content is suppressed. Source and Python dependencies are pinned. Normal PDF upload requires a scanner.

These controls do not prove complete object-level native permission isolation, atomic multi-statement operations, safety of every import/upload route, endpoint-level role boundaries, external SMTP security or legal compliance. Do not issue foster-only accounts before object-level access is independently verified. Keep native API, third-party publishers and unreviewed integrations disabled.

Production operators must manage patching, TLS, least privilege, secret rotation, backup encryption/off-host copies, account recovery, deletion and retention policies, incident response and access reviews. Restrict PostgreSQL credentials and server administrative access. Backups and exports are sensitive. Do not log enquiry bodies, medication instructions, passwords, TOTP secrets or people records.

For incidents: restrict access, preserve protected evidence, identify exposed records and affected people, rotate relevant credentials, reconcile interrupted care/placement writes, restore only into an isolated verified environment, and assess notification responsibilities with the organisation's responsible person. Record actions and times without posting private evidence here.
