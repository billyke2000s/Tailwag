# Foster-carer workspace

The optional `/foster` workspace uses the existing staff login, canonical people/households, foster movements, animal logs and diary. It does not create another animal database. It is disabled by default with `FOSTER_PORTAL_ENABLED=false`.

## Account setup

1. Upgrade the canonical database using DEPLOYMENT.md before starting this revision. Extension migrations create technical receipts and a persistent carer-account marker; neither stores a duplicate animal or care plan. Backups must include these tables.
2. Review the household assessment, recorded foster capacity and current dated placement in the native application.
3. Create a separate individual account linked to that household/person. Assign **only** `Foster carer (portal only)` with no superuser flag or additional roles. Never broaden that role's empty security map. Staff who also foster need separate accounts.
4. Configure a named, active staff reviewer with animal-log and diary access. Fresh installations select the initial administrator; upgrades leave the setting unfilled until reviewed. With the application environment loaded, use the canonical configuration helper:

   ```sh
   export FOSTER_REVIEW_USER=reviewed-staff-username
   python -c 'import os; from shelter.core import database; import asm3.configuration; asm3.configuration.cset(database(), "TailWagFosterReviewUser", os.environ["FOSTER_REVIEW_USER"])'
   ```

5. Set `FOSTER_PORTAL_ENABLED=true` in the private server configuration and restart staff. Complete the synthetic acceptance checks below before issuing real accounts. Confirm the carer knows the organisation's actual emergency and veterinary contact routes outside the application.

Carers sign in at the normal team hostname. The application redirects them to their workspace and requires authenticator enrolment before animal access. Their account page contains only their own authenticator/password controls. Recovery remains the audited administrator process. Setup keys, QR codes and credentials must never be shared in screenshots or issues.

Removing the portal role, adding another role, granting superuser or removing the household link fails closed. A persistent technical marker prevents role removal from silently turning a carer into a generic staff account. There is deliberately no automatic conversion to staff; disable the old account and create an independently reviewed staff account if responsibilities change.

## What is shared

| Information/action | Boundary |
|---|---|
| Animal identity | Name, shelter reference and species only |
| Photo | Preferred JPEG, freshly authorised and re-encoded without embedded metadata; no general media/download route |
| Instructions/tasks | Up to 100 diary items explicitly assigned to the signed-in username and a currently assigned animal; subject, note, time and completion state; internal diary comments excluded |
| Observation | 5–5000 characters; canonical attributed animal log plus a staff review diary task in one transaction |
| Observation history | Up to 50 of this account's own entries for a currently assigned animal; review-task completion is not clinical approval |
| Task completion | Own assigned diary item only; changed instructions require a fresh review; attributed completion with replay protection |

Staff should put only deliberately shared instructions in diary **Subject/Note** and assign the exact carer username. Keep internal material in staff-only records. Do not assign medication administration as a generic diary task: portal completion does not update treatment, vaccination, test, stock or clinical instructions. Authorised staff use the reviewed clinical workflow. The portal does not expose private histories, owner contacts, foster locations, microchip numbers, general search, reports, exports or documents.

An active foster movement must belong to the linked household, start on or before today and have no return or a return after today. Returned, future and deceased animals are excluded on every request. Shared household accounts are individual: their observations and diary assignments remain separate. Access uses the canonical day-based movement dates; it does not provide intraday handover timing.

## Reliability and staff review

Observation, review task, audit and action receipt commit together. The same submission reference and payload reconcile to the existing result after a lost response; a changed payload with the same reference is rejected. Task receipts work similarly. Fresh object access is required even to reconcile an old receipt after a placement ends. No immediate email is sent; staff must monitor their native diary. Do not interpret a saved observation as an emergency alert or promise of immediate review.

The carer boundary runs after the native session loads and blocks all other dynamic staff routes, including routes without native permission checks. Password, roles and household changes revoke the old session. The workspace uses session-bound CSRF, the existing Origin check, autoescaped text and a script-free content security policy. Static assets remain publicly readable. Normal native staff permissions still need their separate complete matrix review.

## Acceptance and evidence

Run TESTING.md. Test two households, future/returned animals, explicit staff-only diary content, forged animal/photo/task IDs, CSRF, role/household changes, authenticator enrolment, replay after a lost response, stale instructions and a failed review-task write. Browser and PostgreSQL checks are included; actual outcomes belong in VERIFICATION.md, not assumed from the script's presence. Organisation-specific accessibility and user acceptance remain required.

## Earlier care-review tasks

This revision corrects the animal-link type for newly created clinical correction review tasks. Alpha.3/alpha.4 used diary link type `0`; native animal diaries require `1`. Earlier tasks remain in the recipient's general diary but may lack the animal tab link. They are not automatically rewritten: an administrator should review tasks titled `Review care plan after completion correction`, verify the treatment and animal, and correct the diary link through the native editor while retaining history. Do not bulk-relink unrelated diary items merely because their numeric LinkID matches an animal.
