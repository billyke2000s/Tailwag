# Document export boundary

The operational HTML-to-PDF entry point uses a restricted WeasyPrint worker. Native configurable shell converters and HTML renderer-switch directives are not used by that entry point. Original templates, document records and signature source images remain in the canonical store. This does not certify a contract, signature, clinical procedure or every inherited document/upload route.

## Supported content

Use semantic headings, paragraphs, tables, inline CSS and embedded PNG/JPEG/WebP images. Images are decoded, bounded and re-encoded. Ordinary absolute web, email and telephone hyperlinks can remain clickable; they are not fetched by the server. PDF output includes structure tags, but correct reading order, alternative text and accessible source content still require review; no PDF/UA conformance is claimed.

File/network/relative resource loads, external stylesheets/fonts, SVG resources, active content and PDF attachments are rejected. A rejected export returns an error rather than silently producing a partially missing PDF. Use approved embedded raster images for logos, photographs and signatures; do not enable a network fetcher as a workaround. Unresolved signature placeholders are omitted, matching the native behaviour; an export alone is not proof of a signed agreement. Renderer-specific legacy options need a template migration review. Standard A3/A4/A5/letter, orientation, bounded exact sizes and margins are supported.

## Bounds and isolation

The child receives HTML through stdin and omits application/database/SMTP/proxy secrets from its environment. It runs under the same restricted operating-system user as the application, with no arbitrary resource fetches. Linux limits bound CPU (15 seconds), address space (1 GiB), output (12 MiB), total pages (200), HTML (2 MiB), image dimensions and raster bytes. The parent has a 20-second timeout. These controls are not a complete operating-system sandbox or a guarantee against all parser vulnerabilities. Keep the pinned renderer, image libraries and server patched.

The image includes DejaVu fonts. Review actual exported pages after changing templates or dependencies; readable text extraction alone does not verify layout. Temporary rendering state is removed; do not log submitted HTML or resource URLs. Downloaded/exported records remain private records under the organisation's approved handling policy.

## Print previews

The three reviewed native server print-preview routes use a sandboxed response with an opaque origin, no scripts or fetched resources, restricted forms/objects/base URLs, and inline presentation styles. Use the browser Print command from that preview. Native in-editor printing is separate; user-authored content and signature workflows still require organisational acceptance. Preview layout before printing, especially where external images or styles have been used in an old template.

## Verification and sources

Tests create real PDF bytes, extract text and page dimensions with Poppler, confirm embedded raster output, reject file/CSS/attachment/SVG/relative/network fetches, verify a local HTTP fixture receives no request, and check environment omission, input/element budgets and adapter timeout reporting. Browser/export/print and container-font checks are recorded only after their CI run passes. See VERIFICATION.md and TESTING.md.

Primary documentation checked 24 October 2026: [WeasyPrint 70 security guidance](https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#security) explains local/network/attachment and resource-exhaustion risks; [the public fetcher API](https://doc.courtbouillon.org/weasyprint/stable/api_reference.html#weasyprint.urls.URLFetcher) documents custom fetchers and fatal fetch errors. No older deprecated fetcher fallback is used.
