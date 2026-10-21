# Verification

```bash
npm ci
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run build:apk
```

Node regression tests cover false/unknown status labels, purpose and health filters, ID-based rewind, corrupted/unsupported local storage, persisted payload validation and offline generation.

Playwright tests run against the production preview. They cover bundled dog/cat images, chat navigation/reload persistence, rapid swipe protection, end-of-deck rewind, filter reconciliation/cancelled drafts, park check-ins, meetup context, persisted sound/alert preferences and the native Back event.

Android validation should inspect the debug APK signature and ZIP contents and confirm bundled web assets are present. Extract the Android project archive and build it separately to check that the export is self-contained.

Manual device checks still matter: first launch in airplane mode, dog/cat navigation, software keyboard and scrolling on a small display, physical Back through nested screens, audio mute, offline image fallbacks and Android install/update behaviour. Automated web tests do not prove device behaviour.

Only record results in STATUS.md when actually observed. CI executes these checks on GitHub and uploads test APK/project artifacts after successful verification.
