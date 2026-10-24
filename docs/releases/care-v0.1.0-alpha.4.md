# TailWag Care 0.1.0-alpha.4 — document export evaluation update

This evaluation candidate adds a bounded document export and print-preview boundary. It is not approval for real organisational use. The independent prototype APK is unchanged.

- Replace the normal HTML-to-PDF entry point with a child worker using explicit resource-fetch restrictions and Linux/parent rendering limits.
- Reject file/network/relative/SVG/attachment resources; accept bounded re-encoded embedded raster images and ordinary clickable web/contact hyperlinks.
- Produce tagged PDF output, include DejaVu fonts in the server image, and test readable text from actual exports. Tags alone do not establish PDF/UA accessibility.
- Isolate the three reviewed native server print-preview routes with a sandbox/CSP and opaque origin, without scripts or resource fetches.
- Add actual editor PDF download, server print-preview and browser event-handler probes, plus container PDF/font verification.

No database schema migration is introduced. Back up and rehearse against isolated staging before upgrade. Review templates that use fetched logos/photos/styles or custom converters: renderer-switch directives are intentionally not honoured, and fetched resources are rejected. Follow docs/DOCUMENTS.md for supported content, limits and remaining boundaries. Original records/signature source images are not rewritten.

Publication requires the full CI run to pass. Local verification, browser outcomes and failures belong in docs/VERIFICATION.md. Organisational/council approval, full role/object/import/upload/clinical/signature workflows, hosting/providers and off-host recovery remain launch gates. No live deployment, email, payment or clinical acceptance is claimed.

Original TailWag idea/files: https://github.com/fpr8653-afk/tailwag. This adaptation is for a friend and claims no original authorship. Canonical foundation: https://github.com/sheltermanager/asm3; preserve THIRD-PARTY.md and platform/LICENSE obligations.
