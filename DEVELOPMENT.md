# Development

Use Node 22.12+ and npm. `npm ci` reproduces `package-lock.json`; do not work around dependency conflicts with force or legacy-peer-deps.

- `npm run dev`: Vite on port 3000.
- `npm run lint`: TypeScript checking.
- `npm test`: Node regression tests.
- `npm run build`: production web bundle, Android asset copy, canonical Android ZIP.
- `npm run preview`: serve `dist` for production checks.
- `npm run test:e2e`: Playwright interaction tests; install Chromium first with `npx playwright install chromium`.
- `npm run build:apk`: web build and Gradle debug APK.

Android uses Java 17, Gradle 8.2, Android Gradle Plugin 8.2.2 and SDK 34. Configure the SDK with ANDROID_HOME or ignored android/local.properties. The Gradle wrapper is committed, including Windows scripts. Initial builds need network access to download Gradle and Maven dependencies.

The canonical Android source lives in android/. Do not maintain a second Java/manifest template inside the frontend. scripts/prepare-android.mjs copies dist into ignored app assets; scripts/package-android.mjs packages that same project with those assets. Do not commit generated APKs, signing keys, SDK paths or build directories.

The exported dist/TailWag-Android-Project.zip includes web assets and builds directly with ./gradlew assembleDebug (Windows: gradlew.bat assembleDebug). Its Linux wrapper has executable ZIP permissions; chmod +x gradlew if an extractor strips them.

.env.example contains optional public hosting/download URLs. Wingman is an offline generator and must never accept a provider secret through a VITE_ variable.
