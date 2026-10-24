# Changelog

## Unreleased — care-v0.1.0-alpha.4

- Add a bounded HTML-to-PDF worker with restricted resources and a reduced child environment.
- Isolate reviewed server print previews and verify real exports, readable fonts and resource rejection.

## care-v0.1.0-alpha.3 — 24 October 2026 · evaluation prerelease

- Guard care completion replays and stock validation on reviewed staff/mobile paths.
- Add transactional clinical/stock/audit updates and attributed stale-safe corrections.
- Add responsive correction/clear dialogs and synthetic failure/concurrency verification.

## care-v0.1.0-alpha.2 — 23 October 2026 · evaluation prerelease

- Reject overlapping dated movements and ignored-field precheck bypasses before native mutations.
- Check future foster occupancy and peak concurrent capacity; retain valid history and explicit returns.
- Expand care/audit, simultaneous staff placement and PostgreSQL lock verification; use HTTP 400 for invalid native input.
- Include browser-test npm manifests in the operational source archive.
- Update Brotli to 1.2.1 after the locked-dependency audit identified the upstream decoder security fix.

## care-v0.1.0-alpha.1 — 22 October 2026 · evaluation prerelease

- Add an isolated, pinned ASM operational foundation and a responsive Django public site.
- Connect four enquiry types to the native private inbox with receipts, duplicate protection and uncertain-write reconciliation.
- Add publication privacy filters, selected placement safeguards, forced TOTP and zero-prefixed code fixes and bounded normal uploads.
- Strengthen canonical passwords and legacy-hash upgrades; revoke stale password/privilege sessions and replace plaintext-email recovery with an audited administrator process.
- Replace vulnerable loaded editor/browser libraries with integrity-pinned distributions and retained corresponding source; restrict sensitive foster reports.
- Verify extracted candidate setup and backup success/failure handling while preserving pre-existing writer state.
- Prepare PostgreSQL/container/proxy/jobs, migration, backup and recovery scripts; fix native view-version comparison and use reviewed non-destructive daily tasks.
- Add source-backed England research, reuse/feature inventory, operational guides and explicit launch evidence gates.
- Preserve the independent original prototype and v1.2.1 APK; no production deployment or operational-readiness claim.

Historical prototype entries below describe their respective revisions and are not claims about current operational capabilities.

## 1.2.1 — Community repair edition

- Publish a clearly attributed repair edition for a mate's original project.
- Include upstream dog/cat features through f993919.
- Preserve local profiles, conversations, discovery history, check-ins and preferences.
- Repair bundled photos, filters, rapid swipes, rewind, meetup shortcuts, status labels and Android Back.
- Add complete Android build files, bundled frontend assets and canonical project export.
- Add verified regression coverage, documentation navigation, issue/PR templates and preview-release automation.
- Keep intentional test content and offline text generation.

 (CHANGELOG.md)

All notable changes to the **TailWag** project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-21

### Added
- **Compiled & Signed Android APK Binary (`public/tailwag.apk` & `dist/tailwag.apk`)**:
  - Full local Android toolchain integration (`aapt`, `dalvik-exchange`, `javac`, `zipalign`, and `apksigner`).
  - Automated compilation pipeline via `scripts/build_apk.sh` producing signed 69KB standalone APK.
  - One-click direct APK download button inside the in-app Android Installation Hub.
  - `"build:apk"` npm script in `package.json`.

---

## [1.1.0] - 2026-10-21

### Added
- **Native Android Project Repository (`/android`)**:
  - `android/app/src/main/AndroidManifest.xml` targeting SDK 34 (Android 14) with permissions for network and vibration.
  - `android/app/build.gradle` and root Gradle configuration files.
  - `MainActivity.java` AndroidX WebView host.
- **PWA & WebAPK Infrastructure**:
  - `vite-plugin-pwa` configuration with standalone display and portrait lock in `vite.config.ts`.
  - Service worker asset precaching (`dist/sw.js`).
  - Standard and maskable PNG icons (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, and `apple-touch-icon.png`).
  - Programmatic icon generator script using `sharp` (`scripts/generate_icons.js`).
- **In-App Android APK & Installation Hub (`AndroidInstallModal.tsx`)**:
  - Direct 1-click WebAPK installation trigger for Android Chrome.
  - Cloud 1-click APK/AAB builder integration via PWABuilder / Bubblewrap.
  - In-browser ZIP packaging tool (`JSZip`) to download the complete ready-to-build Android Studio repository.
- **Documentation Suite**:
  - Added `AGENTS.md`, `README.md`, `PROJECT.md`, `SPECIFICATION.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`, `TESTING.md`, `SECURITY.md`, `STATUS.md`, `DECISIONS.md`, and `CHANGELOG.md`.

---

## [1.0.0] - 2026-10-21

### Added
- **Discovery Deck & Swipe Physics**:
  - Swipable dog profile cards powered by `motion/react` with drag physics.
  - Tactile action triggers: Pass, Like, Super Bark, Rewind, and Detail Sheet.
  - Unboxed metadata styling complying with the Frontend Design Constitution.
- **Match Celebrations & Chat**:
  - Dual avatar match modal with `canvas-confetti` fireworks.
  - Real-time conversation thread simulation with auto-reply engine.
  - Structured in-chat playdate invitation scheduler.
- **Local Dog Parks Live Radar**:
  - Real-time dog headcount tracker and avatar roster for checked-in pups.
  - One-tap check-in/check-out coordinator.
  - Amenities and security fencing specifications.
- **Canine AI Wingman Studio**:
  - Bark-o-Matic Bio Studio powered by `@google/genai` (with zero-delay offline fallbacks).
  - Dynamic 2-dog playstyle compatibility calculator.
  - Humorous Bark-to-Human speech translator.
- **Android System Simulation & Audio**:
  - Google Pixel 9 Pro device frame with status bar (live clock, 5G, battery indicator) and Material 3 bottom navigation.
  - Web Audio API synthesizer for natural canine barks and match chimes.

## 1.2.0 — 2026-10-21

- Repair production/offline test images for dogs and cats.
- Add validated local persistence, ID-based discovery/check-ins and shared sound/alert preferences.
- Fix filter reconciliation, rapid swipes, rewind, unread state and meetup context.
- Make health/verification labels data-driven and add modal Back/focus handling.
- Replace browser provider-key access with local demo generators.
- Add Gradle wrapper/resources, bundled Android assets, canonical project export and build/test CI.
- Replace the obsolete preview-loading APK with reproducible debug-build outputs.
