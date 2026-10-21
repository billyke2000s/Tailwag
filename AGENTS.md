# AI Agent Guidelines & Rules (AGENTS.md)

This document establishes the operational rules and standards for AI coding agents modifying the **TailWag** codebase.

## 1. Core Principles

- **No Hallucinated UI**: Do not add non-functional buttons, placeholder toggles, dummy counters, or cosmetic telemetry. Every interactive affordance must have a working handler.
- **Canine Domain Authenticity**: UI terminology must reflect natural pet owner language (e.g., "Playdate", "Zoomies", "Fetch", "Dog Park") rather than generic social media jargon.
- **Anti-Slop Discipline**:
  - Never wrap static metadata in capsule badges or pill boxes. Use unboxed text separated by subtle typographic dots (`·`).
  - Maintain the 60-30-10 color allocation: 60% neutral canvas, 30% structural surfaces, 10% emerald accent.
  - No decorative pulsing dots or arbitrary innovation scorecards.

## 2. Technical Stack Conventions

- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";`). Do not introduce secondary CSS modules or inline style blocks.
- **Icons**: `lucide-react`. Maintain consistent icon size ($16\text{px}$–$24\text{px}$) and stroke width ($1.5$–$2.5$).
- **Animations**: `motion/react` for card gestures and spring transitions.
- **Sound**: Web Audio API (`src/utils/audio.ts`). Never add external `.mp3` or `.wav` dependencies that may fail over network boundaries.
- **Prototype generators**: Preserve offline dog/cat text generation in `src/utils/gemini.ts`. Never expose a provider API key to the frontend. A future cloud integration needs a server endpoint.

## 3. Android & Mobile Standards

- **Touch Hitboxes**: Ensure all interactive controls have minimum touch targets of $44 \times 44\text{px}$.
- **Ergonomics**: Keep primary action CTAs and navigation tabs within the bottom 40% thumb reach zone.
- **WebAPK / PWA**: Maintain compliance with `vite-plugin-pwa` and Web App Manifest specifications in `vite.config.ts`.
- **Android Gradle**: Keep the native Android project in `/android` synchronized with updates in package identifier (`com.tailwag.dogmatch`) and API target (SDK 34).

## 4. Verification Workflow

Before concluding any change:
1. Run `npm run lint`, `npm test`, and `npm run build`.
2. Run production browser tests with `npm run test:e2e` and build Android with `npm run build:apk` when tools are available.
3. Report blocked checks honestly. Preserve intentional sample content and simulations; no production backend is required.
4. Keep Android source in `/android`; generate exports from it instead of duplicating native templates.
