# Native browser library review

Checked 22 October 2026. Python package scanning does not cover JavaScript bundled inside ASM. The review identified TinyMCE 5.5.1 as a loaded dependency with a [published upstream XSS advisory](https://github.com/tinymce/tinymce/security/advisories/GHSA-w7jx-j77m-wp65). Candidate publication was paused while replacing it and testing the real editor.

| Loaded library | Selected version | Treatment |
|---|---|---|
| TinyMCE | 8.10.0 | Current reviewed community release; [changelog](https://www.tiny.cloud/docs/tinymce/latest/changelog/). GPL v2 or later; GPL mode declared. Exact corresponding TypeScript/project source retained at pinned revision. |
| jQuery | 3.7.1 | Compatible critical-fix line for the inherited plugins; a move to v4 requires a separate integration review. MIT notices retained. |
| jQuery UI | 1.14.2 | [Maintained compatibility release](https://blog.jqueryui.com/2026/01/jquery-ui-1-14-2-released/); official distribution and notices retained. |
| Moment | 2.31.0 | Retained for the inherited calendar API and updated beyond [the published locale validation advisory](https://github.com/moment/moment/security/advisories/GHSA-4p3w-j4w9-5jqw). MIT notices retained. |

`platform/browser-assets.json` pins download URLs, SHA-512 integrity and editor source revision. `fetch-browser-assets.py` verifies every archive, bounds downloads/extraction, refuses unsafe paths and retains notices/source. `platform/browser-dependencies/` is a separate advisory inventory, not a second frontend application. Its exact versions must match the asset lock. npm audit checks those packages; it does not certify the entire native client.

Native asset configuration points at the reviewed distribution paths. Requests for old jQuery/UI/Moment/TinyMCE JavaScript paths are blocked even though original source is retained for provenance. The adaptation fingerprint in BUILD changes when patches, staff styling or asset pins change, invalidating native asset URLs.

## Editor migration

Followed the [official v5 to v8 migration guide](https://www.tiny.cloud/docs/tinymce/latest/migration-from-5x-to-8x/). Font controls and settings use current names; GPL mode is explicit; removed/integrated plugins are no longer requested. A local Print button retains the native browser/server print workflow. Native agreement/document templates remain the canonical template feature. The unused legacy editor `template` plugin had no configured template library or toolbar action; it is not replaced by a paid integration.

Tests verify loaded versions, initialisation, basic event-handler sanitisation and an actual template save/reload. A basic sanitisation check is not a comprehensive XSS penetration test. Complete document/PDF/signature workflows and alternative content/import paths remain launch checks.

## Limits of advisory results

An exploratory audit of historical npm build dependencies for other bundled libraries reported 157 transitive findings, largely from FullCalendar's historical build toolchain. That toolchain is not installed or executed by this platform; it must not be conflated with shipped browser code. The inherited runtime also includes Bootstrap 5.1.0, CodeMirror 5.65.2 with local changes, FullCalendar 3.10.2, Chart.js 4.4.9, Leaflet 1.9.4 and other native widgets. Their complete security history and every runtime path have not been cleared. No claim of zero vulnerabilities across all native assets is made. Review and test further changes before real launch.
