"""Bounded PDF worker: no database credentials or arbitrary resource fetches."""

import base64
import io
import logging
import re
import resource
import sys
from html.parser import HTMLParser
from urllib.parse import urlsplit

MAX_HTML = 2 * 1024 * 1024
MAX_IMAGE = 4 * 1024 * 1024
MAX_PDF = 12 * 1024 * 1024


def limits():
    resource.setrlimit(resource.RLIMIT_CPU, (15, 16))
    resource.setrlimit(resource.RLIMIT_AS, (1024**3, 1024**3))
    resource.setrlimit(resource.RLIMIT_FSIZE, (MAX_PDF, MAX_PDF))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))


class DocumentPolicyError(ValueError):
    pass


class PolicyParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.elements = 0

    def handle_starttag(self, tag, attrs):
        self.elements += 1
        if self.elements > 20000:
            raise DocumentPolicyError("Document has too many elements")
        attrs = dict(attrs)
        if tag in ("base", "script", "iframe", "object", "embed", "svg", "math"):
            raise DocumentPolicyError("Unsupported active or embedded document content")
        if tag == "a" and attrs.get("href"):
            href = attrs["href"].strip()
            if not href.startswith("#") and urlsplit(href).scheme.lower() not in (
                "http",
                "https",
                "mailto",
                "tel",
            ):
                raise DocumentPolicyError("Use absolute web or contact hyperlinks")
        if "attachment" in (attrs.get("rel") or "").lower().split():
            raise DocumentPolicyError("PDF attachments are disabled")
        if tag == "meta" and (attrs.get("http-equiv") or "").lower() == "refresh":
            raise DocumentPolicyError("Document redirects are disabled")

    handle_startendtag = handle_starttag


def renderer(html):
    # Imports happen after resource limits in the isolated child process.
    from PIL import Image, ImageOps
    from weasyprint import HTML
    from weasyprint.urls import URLFetcher, URLFetcherResponse, FatalURLFetchingError

    class EmbeddedImages(URLFetcher):
        def __init__(self):
            super().__init__(allowed_protocols={"data"}, allow_redirects=False)
            self.total = 0

        def fetch(self, url, headers=None):
            match = re.fullmatch(
                r"data:image/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=\s]+)", url
            )
            if not match or len(match[1]) > MAX_IMAGE * 4 // 3 + 16:
                raise FatalURLFetchingError(
                    "PDF resource blocked; use embedded raster images"
                )
            try:
                data = base64.b64decode(re.sub(r"\s", "", match[1]), validate=True)
                if len(data) > MAX_IMAGE:
                    raise ValueError()
                with Image.open(io.BytesIO(data)) as image:
                    if (
                        image.format not in ("PNG", "JPEG", "WEBP")
                        or image.width * image.height > 12_000_000
                    ):
                        raise ValueError()
                    image = ImageOps.exif_transpose(image).convert("RGBA")
                    background = Image.new("RGBA", image.size, "white")
                    background.alpha_composite(image)
                    image = background.convert("RGB")
                    image.thumbnail((2400, 2400))
                    output = io.BytesIO()
                    image.save(output, "PNG")
                    safe = output.getvalue()
                self.total += len(safe)
                if self.total > 8 * 1024 * 1024:
                    raise ValueError()
            except Exception:
                raise FatalURLFetchingError(
                    "PDF image is invalid or exceeds resource limits"
                ) from None
            return URLFetcherResponse(url, safe, {"Content-Type": "image/png"})

    if not isinstance(html, str) or len(html.encode()) > MAX_HTML:
        raise DocumentPolicyError("Document exceeds the PDF input limit")
    parser = PolicyParser()
    parser.feed(html)
    # An explicit base makes relative loads hit the same rejecting fetcher.
    document = HTML(
        string=html, base_url="https://pdf.invalid/", url_fetcher=EmbeddedImages()
    ).render()
    if len(document.pages) > 200:
        raise DocumentPolicyError("Document exceeds the PDF page limit")
    # Belt and braces: no attachment metadata is forwarded to the final writer.
    document.metadata.attachments = []
    result = document.write_pdf(pdf_tags=True)
    if len(result) > MAX_PDF:
        raise DocumentPolicyError("Document exceeds the PDF output limit")
    return result


def main():
    limits()
    logging.getLogger("weasyprint").disabled = True
    try:
        raw = sys.stdin.buffer.read(MAX_HTML + 1)
        if len(raw) > MAX_HTML:
            raise DocumentPolicyError("Document exceeds the PDF input limit")
        data = raw.decode("utf-8")
        pdf = renderer(data)
        sys.stdout.buffer.write(pdf)
    except Exception:
        # Never echo submitted care content, file paths, resource URLs or secrets.
        sys.stderr.write(
            "PDF rendering rejected or failed. Review document content and limits.\n"
        )
        raise SystemExit(2)


if __name__ == "__main__":
    main()
