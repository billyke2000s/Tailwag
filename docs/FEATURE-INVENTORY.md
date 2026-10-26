# Adopted feature inventory

Inventory based on the [ASM 52u manual index](https://sheltermanager.com/repo/asm3_help/index.html), checked 22 October 2026, and pinned source. “Retained” means code and native workflows remain available, not that this organisation has approved or fully verified them. Optional modules are not enabled simply because upstream includes them.

| Upstream capability group | Disposition | Organisation fit / verification boundary |
|---|---|---|
| Search, links, animal records, templates, bulk changes, observations, litters | Retained | Canonical records; bulk/import safety still requires review |
| People, household information, flags, deduplication, bulk changes | Retained | Assessment/privacy/access policies required |
| Movements, reservations, trials, books, coordinators | Adapted | Selected adoption/foster guards added; universal atomicity/occupancy not claimed |
| Documents, PDF directives, templates, electronic/mobile/user signatures | Adapted/gated | Bounded PDF worker and selected sandboxed print previews verified; supported directives in DOCUMENTS.md; scanner and approved agreement/signature workflow still required |
| Animal control, incidents, dispatch, citations, licensing and equipment | Optional, gated | Not default enforcement functionality for a rescue; logs/incidents used as appropriate |
| Boarding book/calendar | Optional, gated | Only after actual activity/licensing decision |
| Clinic waiting/consulting rooms/calendar | Optional, gated | Only for authorised actual clinical services |
| Events and event website integration | Retained/gated | Operational events optional; publishing not configured |
| Lost/found, matching/scoring and waiting list | Retained | Manual review; matching is not ownership proof |
| General diary, notes, appointments and calendars | Retained | Staff handover/scheduling; reminders require verified delivery |
| Medical books, treatments, vaccinations, tests and regimens | Retained | Professional instructions only; selected tests, full clinical UAT open |
| Financial records, donations, payments, due items, account/ledger and reconciliation | Retained/gated | Native accounting records; no configured processor or real transaction claim |
| Stock, locations, usage and equipment | Retained | Actual purchasing/stock policy and role checks required |
| Volunteers, rota, training and staff duties | Retained | Appropriate limited accounts; safeguarding policies external |
| Online forms and incoming applications | Adapted | Four public enquiry types connect to native inbox; no automatic approval |
| Reports, charts, mail merge and exports | Retained/restricted | Sensitive output; per-role and data-minimisation review required |
| Internet publishing, adoption listings and external services | Adapted/gated | Narrow public projection replaces generic public access; third parties/API disabled |
| Imports, CSV, database maintenance, lookups and configuration | Retained/restricted | Admin only; reviewed mapping/restore and alternate-path checks required |
| Users, roles, settings, TOTP, audit and recovery | Adapted | Forced enrolment fix, safe defaults and role templates; complete endpoint/object tests open |
| Native mobile interface and responsive private screens | Retained/adapted | Scoped stylesheet; representative smoke checks, full workflow accessibility open |
| Daily cron, notifications, news and downloaded reports | Adapted/gated | Reviewed local daily worker; automatic deletion/anonymisation/hold expiry and remote downloads/publishing excluded; provider/error/retry verification required |

No upstream code groups were silently deleted. Unnecessary public/native service endpoints are blocked at the WSGI/proxy boundary. Gated modules remain source-visible for maintainability but should not receive staff permissions until justified and verified. The new public projection and original prototype are separately documented.
