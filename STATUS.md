# Status — 1.2.1 community repair edition

The project remains a dog/cat playdate prototype with intentional test data and simulated matches, replies, park activity and playdates. No production backend or adoption/fostering conversion was added.

## Verified locally

- Clean npm lockfile installation succeeds without force or legacy peer resolution.
- TypeScript checks pass.
- Six Node regression tests pass.
- Production build succeeds and includes all eight local fixture photos.
- Android debug APK builds using the committed wrapper, Java 17 and SDK 34.
- APK signature verifies and the archive contains bundled web assets, compiled classes and all eight local fixture photos.
- The exported Android project builds independently after extraction.

All eight production-browser regression tests pass, including offline loading, profile edits, chat continuity, filters, rapid swipes, meetup selection and preferences. Browser automation used Chromium headless shell; no physical Android device or emulator was available. A debug APK build and browser tests do not establish real-device behaviour or production readiness.

## Limitations

State is local to the browser/WebView, not synchronized across devices. External avatar/font requests use local/system fallbacks offline. Wingman uses local templates, not cloud AI. Debug signing is for tests; release signing and publication are separate owner-controlled steps.

Destination repository: https://github.com/billyke2000s/Tailwag. Current publication and CI results must be checked on GitHub. Original source attribution and tracked upstream revision are in CREDITS.md and UPSTREAM.md. The original source repository has not been modified remotely.
