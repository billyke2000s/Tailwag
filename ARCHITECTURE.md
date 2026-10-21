# Architecture

React 19 and TypeScript render the existing dog/cat prototype. Vite with Tailwind and Motion builds the frontend. Test images are explicit module imports; Vite fingerprints them and Workbox precaches local image and app assets.

App owns species, navigation, saved profiles, matches and filters. ChatView remains mounted across tab changes so simulated replies can complete. It persists messages and drafts and reports new messages to App for previews and unread counts. DogParksView derives its roster/count from fixture data and an ID-based persisted check-in, avoiding stale copies of the pet profile.

utils/storage.ts provides versioned, validated local persistence and a shared React subscription store. Schemas in utils/validation.ts reject malformed restored records. No remote data service exists. soundManager owns a shared audio preference and master gain node; muting applies to active sound output.

utils/navigation.ts dispatches prioritized Back handlers and supplies modal focus management. The Android Activity dispatches a cancellable event; only when the React app does not consume it does the Activity exit. No native JavaScript interface is exposed.

android/ is the sole Android source. WebViewAssetLoader serves bundled dist assets on a local HTTPS origin. The build copies web assets, packages the canonical source ZIP, and Gradle builds the APK. Outputs and private SDK/signing configuration are ignored by git.

utils/gemini.ts retains the existing generator function names for callers but now uses offline text templates only. It contains no API keys or provider SDK.
