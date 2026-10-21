# Contributing

This is repair work for a friend's prototype. Read CREDITS.md, AGENTS.md and DEVELOPMENT.md first. Preserve dog/cat fixtures and intentional simulated interactions.

## A focused contribution

1. Open an issue describing the problem or agreed feature.
2. Work on a branch from main and inspect the affected behaviour.
3. Make the smallest coherent repair. Avoid unrelated redesigns or new services.
4. Add regression coverage for meaningful behaviour changes.
5. Run npm run lint, npm test and npm run build. Run browser and Android checks when relevant.
6. Open a pull request with the problem, resulting behaviour, evidence and remaining limitations.

Use conventional, descriptive commit subjects such as `fix: preserve chat drafts across tabs` or `docs: clarify APK installation`. Never include credentials, signing keys, personal test data, generated build folders or machine-specific SDK paths.

Report actual checks; a test plan is not a passing test. Update affected documentation without duplicating it. Keep original attribution and existing notices intact. Please communicate respectfully and explain disagreements in terms of concrete behaviour and evidence.
