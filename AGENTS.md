# Contributor and coding-agent instructions

Read PROJECT.md, SPECIFICATION.md, ARCHITECTURE.md and STATUS.md before changing behaviour. This branch adds real shelter operations under `platform/`; the original React/Android prototype remains independently supported at the repository root. The user explicitly authorised this expansion; older prototype-only rules do not constrain the platform.

- Preserve upstream authorship, copyright, data and working prototype features. Never claim this adaptation invented TailWag or ASM.
- Animal Shelter Manager is the canonical animal, person, medical, movement and staff store. Do not create competing operational records in Django.
- Fetch exactly `platform/upstream.json`. Apply source patches through checked, repeatable anchors. Review schema and internal API changes before updating the pin.
- No secrets, private records, real care histories or identifiable people in fixtures, screenshots or commits. Demonstrations must be clearly synthetic.
- Public responses use an explicit field allowlist and current publication eligibility. Internal notes, foster addresses and documents remain private. Never fall back to private comments.
- Check permissions on the server. Role templates are starting points, not evidence that every native route is isolated. Foster-only accounts remain disabled until object-level access is verified.
- No invented veterinary prescriptions or doses. Never silently end placements, override sanctuary status, retry uncertain writes or erase history to make a test pass.
- Do not present unconfigured email, payments, scanners or third-party publishing as operational. All visible controls need a real workflow or an explicit unavailable state.
- Keep legal requirements, recommended practice and optional features distinct. England is configured; local authority and activity classification still require confirmation.
- Keep changes and verification checkpointed to GitHub. Record failures and environmental limits in docs/VERIFICATION.md. Production readiness requires the launch evidence in docs/LAUNCH-READINESS.md.

## Checks

Platform: `.venv/bin/python platform/scripts/test.py`, `.venv/bin/python platform/scripts/test-core.py`, `node platform/scripts/browser-test.mjs`, dependency audit and CI deployment checks. Read TESTING.md for prerequisites and database isolation. Never run destructive test scripts on operational databases.

Prototype changes: `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`; APK checks when Android tools are available. Preserve intentional sample content and offline generators. Never put provider secrets in browser code.

Use accessible controls, visible keyboard focus, reduced motion and responsive layouts. GitHub README supports links, badges, tables, details and diagrams, not arbitrary executable widgets.

Browser-library updates must change browser-assets.json integrity/source pins and the browser-dependencies advisory inventory together. Preserve corresponding source and licence notices. Re-run actual editor save/print and rich-text workflows when updating TinyMCE; a successful sign-in alone does not verify document editing. Never re-enable old vulnerable static script paths to make a screen load.
