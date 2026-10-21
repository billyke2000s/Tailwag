# Security and privacy

This is a local prototype with sample profiles and simulated interactions. Health, verification and compatibility fields are test data, not proof of real checks or animal safety. There is no authentication, server authorization or multi-device messaging.

## Local data

Profiles, matches, chat history, discovery history and preferences are stored on the current browser/WebView origin in versioned local storage. Invalid payloads fall back to sample defaults; unsupported versions are not blindly loaded. Storage is not encrypted and is unsuitable for sensitive real user data. Clearing app/browser data removes it. Blocked/full storage falls back to memory for the session.

## Credentials

No provider credentials are needed. The Wingman uses local text templates. Do not embed private keys in browser bundles, VITE_ variables, APK resources or source archives.

## Android

The APK loads bundled assets through AndroidX WebViewAssetLoader on the HTTPS appassets.androidplatform.net origin. Cleartext traffic, file access, content access and mixed content are disabled. The app exposes no JavaScript-to-native interface. HTTPS links outside the local origin open externally; other navigation schemes are blocked. JavaScript is enabled for the React app. SSL errors are not bypassed. Back asks the app to close the active modal/conversation or return to discovery before exiting.

Permissions are INTERNET, ACCESS_NETWORK_STATE and VIBRATE. Backups are disabled for the app. Debug APKs use development signing and are for testing; release signing is a separate owner-controlled process. External avatar and font hosts receive normal network requests when available.

Report vulnerabilities privately to the repository maintainer. Never publish credentials or personal data in an issue.
