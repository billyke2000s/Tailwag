import os


class Headers:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if os.getenv("TRUST_PROXY") == "true" and request.META.get("HTTP_X_REAL_IP"):
            request.META["REMOTE_ADDR"] = request.META["HTTP_X_REAL_IP"]
        response = self.get_response(request)
        response["Content-Security-Policy"] = (
            "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
        )
        response["Referrer-Policy"] = "same-origin"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response["Cache-Control"] = "no-store"
        return response
