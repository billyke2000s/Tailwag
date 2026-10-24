"""Synthetic resource-boundary and real PDF export integration tests."""

import base64
import io
import pathlib
import re
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from unittest import TestCase
from unittest.mock import patch
from PIL import Image

from shelter.documents import render


class DocumentTests(TestCase):
    def png(self):
        image = io.BytesIO()
        Image.new("RGBA", (50, 50), (22, 78, 67, 128)).save(image, "PNG")
        return image.getvalue()

    def test_real_pdf_contains_readable_text_and_landscape_page(self):
        pdf = render(
            "<h1>Synthetic agreement verification</h1><p>Test only - no real care records.</p><!-- pdf orientation landscape -->"
        )
        text = subprocess.check_output(["pdftotext", "-", "-"], input=pdf).decode()
        self.assertIn("Synthetic agreement verification", text)
        info = subprocess.check_output(["pdfinfo", "-"], input=pdf).decode()
        self.assertRegex(info, r"Tagged:\s+yes")
        size = re.search(r"Page size:\s+([\d.]+) x ([\d.]+)", info)
        self.assertIsNotNone(size)
        self.assertGreater(float(size[1]), float(size[2]))

    def test_embedded_raster_is_rendered(self):
        uri = "data:image/png;base64," + base64.b64encode(self.png()).decode()
        pdf = render('<p>Synthetic image fixture</p><img src="' + uri + '">')
        images = subprocess.check_output(
            ["pdfimages", "-list", "-"], input=pdf
        ).decode()
        self.assertGreater(len(images.splitlines()), 2)

    def test_file_css_relative_and_attachment_resources_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            file = pathlib.Path(temporary) / "synthetic-private.png"
            file.write_bytes(self.png())
            uri = file.as_uri()
            for html in (
                '<img src="' + uri + '">',
                '<style>@import "' + uri + '";</style>',
                '<a rel="attachment" href="' + uri + '">Synthetic</a>',
                '<link rel="attachment" href="' + uri + '">',
                '<img src="relative-private.png">',
                '<object data="' + uri + '"></object>',
                '<base href="file:///">',
            ):
                with self.subTest(html=html), self.assertRaises(ValueError):
                    render(html)

    def test_svg_and_non_image_data_resources_are_rejected(self):
        for uri in (
            "data:image/svg+xml;base64,PHN2Zy8+",
            "data:text/plain;base64,U3ludGhldGlj",
        ):
            with self.subTest(uri=uri), self.assertRaises(ValueError):
                render('<img src="' + uri + '">')

    def test_network_fetch_is_rejected_without_contacting_server(self):
        calls = []
        image = self.png()

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                calls.append(self.path)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(image)

            def log_message(self, *args):
                pass

        server = HTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            url = f"http://127.0.0.1:{server.server_port}/synthetic"
            with self.assertRaises(ValueError):
                render('<img src="' + url + '">')
            self.assertEqual(calls, [])
        finally:
            server.shutdown()
            thread.join()
            server.server_close()

    def test_external_web_hyperlinks_do_not_require_fetching(self):
        pdf = render(
            '<p>Synthetic link <a href="https://example.invalid/help">Help</a></p>'
        )
        self.assertTrue(pdf.startswith(b"%PDF-"))

    def test_oversized_input_and_extreme_dimensions_are_rejected(self):
        for html in (
            "x" * (2 * 1024 * 1024 + 1),
            "<!-- pdf papersize exact 1mmx2mm end -->",
            "<!-- pdf margins 999999cm end -->",
            "<!-- pdf papersize exact badxcode end -->",
        ):
            with self.subTest(size=len(html)), self.assertRaises(ValueError):
                render(html)

    def test_element_budget_is_enforced(self):
        with self.assertRaises(ValueError):
            render("<span>x</span>" * 20001)

    def test_application_secrets_are_not_forwarded_to_renderer(self):
        original = subprocess.run
        observed = []

        def inspect(*args, **kwargs):
            observed.append(kwargs["env"])
            return original(*args, **kwargs)

        with (
            patch.dict(
                "os.environ",
                {
                    "SECRET_KEY": "synthetic-secret-not-to-pass",
                    "PGPASSWORD": "synthetic-pg-secret",
                },
            ),
            patch("shelter.documents.subprocess.run", side_effect=inspect),
        ):
            render("<p>Synthetic environment boundary</p>")
        self.assertEqual(len(observed), 1)
        self.assertNotIn("SECRET_KEY", observed[0])
        self.assertNotIn("PGPASSWORD", observed[0])

    def test_native_adapter_does_not_honor_unrestricted_renderer_directives(self):
        from shelter import core
        import asm3.utils

        pdf = asm3.utils.html_to_pdf(
            core.database(),
            "<!-- pdf renderer cmd --><p>Synthetic native PDF export</p>",
        )
        self.assertIn(
            "Synthetic native PDF export",
            subprocess.check_output(["pdftotext", "-", "-"], input=pdf).decode(),
        )

    def test_native_adapter_reports_timeout_without_document_content(self):
        from shelter import core
        import asm3.utils

        with patch(
            "shelter.documents.subprocess.run",
            side_effect=subprocess.TimeoutExpired(["worker"], 20),
        ):
            with self.assertRaises(asm3.utils.ASMValidationError) as error:
                asm3.utils.html_to_pdf(
                    core.database(), "<p>Synthetic sensitive text</p>"
                )
        self.assertNotIn("Synthetic sensitive text", str(error.exception))

    def test_active_hyperlinks_and_inline_svg_are_rejected(self):
        for html in (
            '<a href="javascript:alert(1)">Synthetic</a>',
            '<a href="file:///synthetic">Synthetic</a>',
            "<svg><text>Synthetic</text></svg>",
        ):
            with self.subTest(html=html), self.assertRaises(ValueError):
                render(html)

    def test_print_preview_is_sandboxed_without_scripts_or_external_resources(self):
        from shelter.documents import print_preview
        from shelter import core
        import asm3.utils

        class Endpoint:
            def __init__(self):
                self.headers = {}

            def content_type(self, value):
                self.headers["Content-Type"] = value

            def header(self, name, value):
                self.headers[name] = value

        endpoint = Endpoint()
        html = print_preview(
            endpoint,
            '<p>Synthetic preview</p><img src="data:image/png;base64,bad" onerror="alert(1)">',
        )
        self.assertIn("Synthetic preview", html)
        self.assertIn("sandbox", endpoint.headers["Content-Security-Policy"])
        self.assertIn("script-src 'none'", endpoint.headers["Content-Security-Policy"])
        with self.assertRaises(asm3.utils.ASMValidationError):
            print_preview(endpoint, "<script>synthetic()</script>")
