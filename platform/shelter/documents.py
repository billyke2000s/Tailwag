"""Restricted PDF adapter for the native renderer entry point."""

from pathlib import Path
import os
import re
import subprocess
import sys
import tempfile

MAX_HTML = 2 * 1024 * 1024
MAX_PDF = 12 * 1024 * 1024


def page_style(html):
    size = "A4"
    for name in ("a3", "a4", "a5", "letter"):
        if f"pdf papersize {name}" in html:
            size = name
    orientation = "landscape" if "pdf orientation landscape" in html else "portrait"
    margins = "1cm"
    directive = re.search(r"pdf margins (.+?) end", html)
    if directive:
        values = directive[1].split()
        if not 1 <= len(values) <= 4:
            raise ValueError("Invalid page margins")
        for value in values:
            match = re.fullmatch(r"(\d+(?:\.\d+)?)(mm|cm|in|pt|px)", value)
            if (
                not match
                or float(match[1])
                * {"mm": 1, "cm": 10, "in": 25.4, "pt": 25.4 / 72, "px": 25.4 / 96}[
                    match[2]
                ]
                > 100
            ):
                raise ValueError("Page margins exceed supported limits")
        margins = " ".join(values)
    exact = re.search(r"pdf papersize exact (.+?) end", html)
    if exact:
        dimensions = exact[1].lower().split("x")
        if len(dimensions) != 2:
            raise ValueError("Invalid page dimensions")
        for value in dimensions:
            match = re.fullmatch(r"(\d+(?:\.\d+)?)(mm|cm|in|pt|px)", value)
            if not match:
                raise ValueError("Invalid page dimensions")
            mm = (
                float(match[1])
                * {"mm": 1, "cm": 10, "in": 25.4, "pt": 25.4 / 72, "px": 25.4 / 96}[
                    match[2]
                ]
            )
            if not 10 <= mm <= 2000:
                raise ValueError("Page dimensions exceed supported limits")
        size, orientation = " ".join(dimensions), ""
    return f"@page {{ size: {size} {orientation}; margin: {margins}; }} body {{ font-family: sans-serif; font-size: 11pt; }}"


def render(html):
    if not isinstance(html, str) or len(html.encode()) > MAX_HTML:
        raise ValueError("Document exceeds the PDF input limit")
    # Match the native treatment of unresolved signature placeholders.
    html = re.sub(r"<img\b[^>]*\bsrc=[\"\']signature:[^>]*>", "", html, flags=re.I)
    style = page_style(html)
    source = (
        '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><style>'
        + style
        + "</style></head><body>"
        + html
        + "</body></html>"
    )
    if len(source.encode()) > MAX_HTML:
        raise ValueError("Document exceeds the PDF input limit")
    worker = Path(__file__).with_name("pdf_worker.py")
    with tempfile.TemporaryDirectory(prefix="tailwag-pdf-") as temporary:
        # Omit database, SMTP, proxy, account and application secrets from the child.
        result = subprocess.run(
            [sys.executable, str(worker)],
            input=source.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=20,
            cwd=temporary,
            env={"PATH": os.defpath, "LANG": "C.UTF-8"},
        )
    if (
        result.returncode != 0
        or not result.stdout.startswith(b"%PDF-")
        or len(result.stdout) > MAX_PDF
    ):
        raise ValueError(
            "PDF could not be rendered. Use embedded PNG/JPEG/WebP images, remove attachments or external resources, and simplify large documents."
        )
    return result.stdout


def html_to_pdf(dbo, html):
    import asm3.utils

    try:
        return render(html)
    except (ValueError, subprocess.TimeoutExpired) as error:
        message = (
            str(error)
            if isinstance(error, ValueError)
            else "PDF rendering exceeded its time limit; simplify the document."
        )
        raise asm3.utils.ASMValidationError(message) from None


PRINT_POLICY = "sandbox allow-modals; default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"


def print_preview(endpoint, html):
    from .pdf_worker import PolicyParser
    import asm3.utils

    if not isinstance(html, str) or len(html.encode()) > MAX_HTML:
        raise asm3.utils.ASMValidationError("Document exceeds the print input limit")
    try:
        PolicyParser().feed(html)
    except ValueError:
        raise asm3.utils.ASMValidationError(
            "Remove active content, attachments or unsupported links before printing"
        ) from None
    endpoint.content_type("text/html")
    endpoint.header("Content-Security-Policy", PRINT_POLICY)
    return (
        '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Print preview</title><style>body{font:14px system-ui,sans-serif;color:#203c34;margin:24px}#print-help{padding:12px;border:1px solid #acbba9}@media print{#print-help{display:none}}</style></head><body><p id="print-help">Use your browser Print command. External resources and scripts are disabled in this preview.</p>'
        + html
        + "</body></html>"
    )
