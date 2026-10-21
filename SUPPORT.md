# Support and troubleshooting

## Installation or build failures

- Use Node 22.12+ and `npm ci` with the committed lockfile. Do not use force/legacy-peer flags to hide dependency conflicts.
- Android builds need a full Java 17 JDK (including jlink), SDK platform 34, build tools 34.0.0 and an SDK path.
- Run `npm run build` before direct Gradle builds. The source checkout does not commit generated web assets.
- The exported Android ZIP includes those assets. Use its Gradle wrapper, including gradlew.bat on Windows.
- If Android rejects an update due to a signing mismatch, the development keys differ. Preserve needed test data before uninstalling the old app.

## State or offline behaviour

Local storage belongs to the current origin/device. A different browser, preview URL or APK cannot automatically access another origin's saved state. Clearing app data resets it. External avatars/fonts can fall back while offline; bundled test photos should remain available.

## Reporting a bug

Use this repository's issue forms. Include the release/version, Android version or browser, steps to reproduce, expected/actual result, and relevant error text. Avoid credentials and personal information. Original product ideas can be discussed with the original author; repair regressions belong here.

See SECURITY.md for private vulnerability reporting.
