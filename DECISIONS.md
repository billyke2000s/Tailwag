# Design decisions

## 001 — Adapt a mature operational core

ASM covers linked animal, care, movement, people, document, stock and finance workflows. Rebuilding those around the original matching prototype would introduce substantial safety and maintenance work. Keep one canonical store and adapt its interface. See docs/REUSE.md.

## 002 — Isolate the original prototype

Retain React/PWA/Android functionality and attribution. The real shelter platform is a separate platform/ application; the APK is not represented as an operational shelter client.

## 003 — Public projection rather than generic native API

A narrow Django boundary reduces accidental exposure and connects forms to the real incoming inbox. Internal extension functions are pinned and reviewed. Broad native API endpoints remain blocked.

## 004 — Fail closed on ambiguous submissions and publication

Never retry a potentially completed native enquiry automatically. Record reconciliation state. Recheck eligibility on profile and photo access, reject private-comment publishing and require explicitly approved media copy.

## 005 — Conservative rollout

Native role maps and selected movement wrappers improve defaults but are not proof of every permission/transaction path. Keep foster logins and unverified imports/integrations gated. Launch status follows evidence rather than the presence of screens.

## 006 — Modest infrastructure

One PostgreSQL database, two application processes, one daily-job process and a TLS proxy avoid overlapping CRMs and queue services. This limits scaling (single staff worker) and retry automation; revisit only when actual workload and failure evidence justify it.
