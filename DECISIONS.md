# Architectural Decisions & Reasoning (DECISIONS.md)

This document records the key architectural choices, trade-offs, and design rationales for the **TailWag** codebase.

---

## ADR-001: Synthesized Web Audio API over Audio Media Files

- **Context**: Canine matching apps require satisfying tactile feedback (barks, swipe whooshes, match fanfares). Hosting external `.mp3` or `.wav` files frequently introduces latency, CORS issues, or broken network requests in sandboxed mobile browsers.
- **Decision**: Synthesize all canine sound effects programmatically using the Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`).
- **Consequences**:
  - *Positive*: Instant zero-latency playback, $0\text{ bytes}$ external audio asset payload, customizable pitch and acoustic formants.
  - *Trade-off*: Synthesizer requires mathematical formant shaping to mimic real canine acoustics.

---

## ADR-002: Dual Android Packaging Strategy (WebAPK + Gradle Repository)

- **Context**: The user requested an Android APK. The AI Studio environment is a Linux container without pre-installed Android SDK, JDK, or Gradle tools, preventing direct on-host binary execution of `gradle assembleRelease`.
- **Decision**: Provide a two-pronged solution:
  1. Full **PWA & WebAPK compliance**: Android Chrome automatically creates and installs an official WebAPK into the Android app drawer.
  2. Complete **native Android Gradle project** in `/android` with an in-browser ZIP generator (`JSZip`) allowing developers to compile `app-debug.apk` in 1 command (`./gradlew assembleDebug`).
- **Consequences**:
  - *Positive*: Immediate, native-like installation for mobile end users without developer tools, plus full source code portability for Android Studio developers.

---

## ADR-003: Gemini API with Intelligent Offline Fallbacks

- **Context**: The AI Wingman features (Bio Generator, Bark Translator) rely on `@google/genai`. However, API keys may not always be configured in development sandboxes or client offline states.
- **Decision**: Architect all AI utility functions in `src/utils/gemini.ts` to query Gemini models when credentials exist, while falling back gracefully to structured canine persona engines if unavailable.
- **Consequences**:
  - *Positive*: Application maintains 100% functional uptime without throwing unhandled promise rejections or displaying blank UI blocks.

---

## ADR-004: Unboxed Typography over Pill Badge Wrappers

- **Context**: Mainstream AI-generated applications clutter interfaces with multi-colored pill badges for non-interactive metadata.
- **Decision**: Render static metadata (breed, size, distance, age) as clean, unboxed text separated by typographic middots (`·`). Interactive controls (filter tabs, action buttons) remain functional button elements.
- **Consequences**:
  - *Positive*: Clean editorial visual hierarchy, elevated readability, and strict alignment with frontend design guidelines.

---

## ADR-005: Hybrid Pixel Frame & Full Viewport Presentation

- **Context**: Evaluators use both mobile devices and wide desktop monitors. Confining a mobile app to a fixed narrow column on a 1440px monitor looks broken; stretching it across full desktop width breaks touch ergonomics.
- **Decision**: Implement `AndroidFrame.tsx` with a dual-mode toggle ("Android Frame" mimicking a Google Pixel 9 Pro device, and "Full Viewport" for expansive displays).
- **Consequences**:
  - *Positive*: Delivers an authentic Android smartphone aesthetic while retaining desktop inspection flexibility.

## Repair decisions — 2026-10-21 (supersedes conflicting prototype claims above)

- Preserve simulated behaviour and dog/cat test fixtures. A production backend and adoption conversion are separate work.
- Use npm with package-lock.json and compatible esbuild/Vite versions for deterministic setup.
- Use versioned local persistence rather than introducing a server. Messages remain mounted to finish simulated replies; unread metadata is owned by App.
- Bundle the production frontend in the APK using WebViewAssetLoader instead of hardcoding the AI Studio preview. This allows offline first launch and avoids depending on another account's preview deployment.
- Generate the downloadable Android ZIP from the canonical android/ tree. Do not maintain separate native templates.
- Keep Wingman local, preserving template functionality without exposing a provider key. Actual cloud AI can be added later behind a secure server endpoint.
- Build debug APKs for testing; release signing and store publication remain owner-controlled.
