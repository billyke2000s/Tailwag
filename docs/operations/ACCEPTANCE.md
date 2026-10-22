# Organisation acceptance rehearsal

Use an isolated staging installation with clearly synthetic people, animals, documents and contact details. This is a test procedure, not evidence that the scenarios have passed. Never rehearse prescribing or emergency decisions on real residents. The responsible organisation must approve the access matrix, care procedures and outcome criteria before live use.

Record the application revision, database version, date, operator role, scenario, expected result, actual result and protected evidence location. Record failures as launch blockers; do not change a clinical or ownership record simply to make a scenario pass.

| Scenario | Actions | Required result |
|---|---|---|
| Intake and ownership | Search for duplicates; record surrender/transfer authority, identity, microchip evidence, species, intake time and private documents | One canonical animal; source and ownership evidence attributed; no automatic public listing |
| Isolation | Place an animal on quarantine/hold; attempt a public profile/photo and adoption from direct URLs | Public access and inappropriate placement refused; internal care remains accessible to authorised staff |
| Authorised care | Enter a synthetic clinician instruction, treatment schedule and staff task; administer one scheduled item under a named account | Exact recorded instruction, date/time and attribution retained; no invented dose or instruction |
| Care correction | Correct an erroneous administration using an approved reason; examine audit and outstanding tasks | Earlier action remains attributable; correction and current schedule are clear |
| Repeated/concurrent administration | Submit the same administration twice; submit from two authorised sessions; interrupt a request | No duplicate stock deduction or unexplained administration; ambiguous result is reconciled before retry |
| Accommodation | Fill an enclosure to its approved species/compatibility limit; attempt another move from two sessions | Capacity and compatibility enforced through all permitted movement paths; previous location/history preserved |
| Foster | Assess a synthetic household, record capacity, place an animal, then try another beyond capacity | Unassessed/unavailable placement refused; household address stays private |
| Foster return | Attempt a second active placement, then explicitly return and arrange a new placement | No silent return; both movement decisions have dates, actor and history |
| Adoption and follow-up | Review an application, matching, decision and agreement; arrange visit, adoption and follow-up | No automatic approval; ownership and agreement evidence preserved; public availability changes promptly |
| Sanctuary | Record permanent residency and care needs; attempt adoption/public publication | Resident stays unavailable until an authorised reviewed correction |
| Incident and end of life | Record a synthetic missing/returned/deceased scenario under the approved SOP | Appropriate history, follow-up and public status; no automatic deletion of care/ownership evidence |
| Applications | Send each of four enquiry types; repeat a submission; simulate an uncertain write | Native inbox and receipt reference agree; no duplicate; uncertain result requires staff reconciliation |
| People and roles | Exercise each assigned role through menus, direct URLs, search, exports, reports, media and writes | Only agreed access; denied operations do not change data; privilege changes revoke stale sessions |
| Recovery | Verify identity privately; recover a synthetic account; re-enrol TOTP and inspect audit | Old sessions invalid; recovery attributed; no plaintext credentials in email, logs or public evidence |
| Imports and bulk actions | Import a small reviewed mapping; repeat it; interrupt a bulk operation | No silent duplication, permission bypass, conflicting placements or lost history; documented reconciliation |
| Notifications | Use the provider’s test environment; simulate refusal, delay and repeated processing | Accurate state and staff-visible failure; no unsupported delivery claim or blind resend |
| Backup and upgrade | Restore an encrypted off-host copy into an empty isolated stack; rehearse a version upgrade and rollback | Animal/care/movement/media/receipt records agree; measured recovery time/loss window; matching code/schema |
| Accessibility | Complete intake, care, application and error recovery using keyboard, phone and agreed assistive technology | Focus/order/labels/errors readable and actionable; no trapped dialogs or hidden essential controls |

Finance, donations, boarding, clinical service and enforcement modules need separate acceptance only where the organisation actually performs those activities. External payment tests must use provider test credentials and verified notifications; never enter card details into this application.

Before approval, attach evidence for every applicable row to a protected organisational record and map it to SPECIFICATION.md and LAUNCH-READINESS.md. Do not put identifiable people, care records, agreement scans, credentials or private foster locations in GitHub. A screenshot or a green unit test cannot substitute for an incomplete scenario.
