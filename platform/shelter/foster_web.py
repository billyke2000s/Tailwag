"""Portal on the existing staff session, with a deny-by-default native gateway."""

import base64
import hmac
from html import unescape
from io import BytesIO
import os
from pathlib import Path
import secrets
import time
from urllib.parse import quote
import uuid

from django.template import Context, Engine
import qrcode

import asm3.media
import asm3.users
import asm3.utils
from . import foster

TEMPLATES = Engine(
    dirs=[str(Path(__file__).resolve().parent.parent / "templates/foster")]
)


def install(main):
    web = main.web

    def user():
        main.ASMEndpoint().check_loggedin(main.session, web)
        current = foster.identity(main.session.dbo, main.session.user)
        if current is None or os.getenv("FOSTER_PORTAL_ENABLED") != "true":
            raise asm3.utils.ASMPermissionError(
                "Foster workspace is unavailable for this account"
            )
        return current

    def csrf():
        token = main.session.get("foster_csrf")
        if not token:
            token = secrets.token_urlsafe(32)
            main.session.foster_csrf = token
        return token

    def post():
        values = web.input()
        if not hmac.compare_digest(str(values.get("csrf", "")), csrf()):
            raise asm3.utils.ASMPermissionError("Form expired; reload the page")
        return values

    def render(template, title, **context):
        web.header("Content-Type", "text/html; charset=utf-8")
        web.header(
            "Content-Security-Policy",
            "default-src 'none'; style-src 'self'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        )
        return TEMPLATES.get_template(template).render(
            Context(
                {"title": title, "csrf": csrf(), **context},
                use_l10n=False,
                use_tz=False,
            )
        )

    def gateway(handler):
        session = main.session
        if session.get("user") and session.get("dbo"):
            # Includes native endpoints that do not call ASMEndpoint.check().
            if not main.ASMEndpoint().is_loggedin(session):
                raise web.seeother("/login")
            current = foster.identity(session.dbo, session.user)
            if current is not None:
                path = web.ctx.path
                if path == "/foster/logout":
                    return handler()
                if os.getenv("FOSTER_PORTAL_ENABLED") != "true":
                    raise asm3.utils.ASMPermissionError(
                        "Foster workspace is disabled; contact the administrator"
                    )
                if path in (
                    "/",
                    "/main",
                    "/mobile",
                    "/change_user_settings",
                ) and web.ctx.method in ("GET", "HEAD"):
                    raise web.seeother("/foster")
                allowed = (
                    path in ("/foster", "/foster/account")
                    or (path.startswith("/foster/animal/") and path[15:].isdigit())
                    or (path.startswith("/foster/photo/") and path[14:].isdigit())
                )
                if not allowed:
                    raise asm3.utils.ASMPermissionError(
                        "This account can only use the foster workspace"
                    )
                enabled = session.dbo.query_int(
                    "SELECT EnableTOTP FROM users WHERE ID = ?", [current.ID]
                )
                if path != "/foster/account" and (
                    not enabled or session.get("force2fa")
                ):
                    raise web.seeother("/foster/account")
        return handler()

    class Dashboard:
        def GET(self):
            current = user()
            return render(
                "home.html",
                "Your foster animals",
                animals=[
                    plain(dict(r)) for r in foster.animals(main.session.dbo, current)
                ],
            )

    class Animal:
        def GET(self, animal_id):
            return self.show(int(animal_id))

        def show(self, animal_id, error="", text="", token=None, success=""):
            current = user()
            db = main.session.dbo
            animal = foster.require_animal(db, current, animal_id)
            task_rows = [dict(r) for r in foster.tasks(db, current, animal_id)]
            for row in task_rows:
                row["VERSION"] = foster.task_version(current, row)
                plain(row)
                row["WHEN"] = display(row["DIARYDATETIME"])
                row["TOKEN"] = str(uuid.uuid4())
            entries = [dict(r) for r in foster.observations(db, current, animal_id)]
            for row in entries:
                plain(row)
                row["WHEN"] = display(row["DATE"])
            return render(
                "animal.html",
                animal.ANIMALNAME,
                animal=plain(dict(animal)),
                tasks=task_rows,
                observations=entries,
                error=error,
                text=text,
                token=token or str(uuid.uuid4()),
                success=success,
            )

        def POST(self, animal_id):
            current = user()
            values = post()
            action = values.get("action", "")
            try:
                task_id = int(values.get("task", "0"))
                result, _ = foster.act(
                    main.session.dbo,
                    current.USERNAME,
                    int(animal_id),
                    values.get("token", ""),
                    action,
                    values.get("text", ""),
                    task_id,
                    values.get("version", ""),
                )
            except ValueError:
                raise asm3.utils.ASMValidationError("Invalid task reference")
            except asm3.utils.ASMValidationError as error:
                web.ctx.status = "400 Bad Request"
                return self.show(
                    int(animal_id),
                    error.msg,
                    values.get("text", ""),
                    values.get("token"),
                )
            # A redirect avoids accidental browser refresh re-submission. Persisted
            # receipts also protect retries after an interrupted response.
            main.session.foster_notice = (
                f"Observation #{result} saved for staff review. Contact the team directly for urgent concerns."
                if action == "observation"
                else "Assigned diary task completed. This does not record medication administration."
            )
            raise web.seeother(f"/foster/animal/{int(animal_id)}?saved=1")

    class Photo:
        def GET(self, animal_id):
            current = user()
            db = main.session.dbo
            foster.require_animal(db, current, int(animal_id))
            media = db.first_row(
                db.query(
                    "SELECT ID FROM media WHERE LinkTypeID = 0 AND LinkID = ? AND WebsitePhoto = 1 "
                    "AND MediaMimeType = 'image/jpeg' ORDER BY ID DESC",
                    [int(animal_id)],
                )
            )
            if not media:
                raise web.notfound()
            data = asm3.media.get_image_file_data(db, "media", str(media.ID))[1]
            from PIL import Image, ImageOps

            if len(data) > 10 * 1024 * 1024:
                raise web.notfound()
            try:
                image = Image.open(BytesIO(data))
                if image.width * image.height > 12_000_000:
                    raise ValueError
                image = ImageOps.exif_transpose(image).convert("RGB")
                image.thumbnail((1000, 1000))
                output = BytesIO()
                image.save(output, "JPEG", quality=85)
            except (OSError, ValueError):
                raise web.notfound()
            web.header("Content-Type", "image/jpeg")
            return output.getvalue()

    class Account:
        def GET(self):
            current = user()
            record = asm3.users.get_user(main.session.dbo, current.USERNAME)
            secret = record.OTPSECRET if not record.ENABLETOTP else ""
            qr = ""
            if secret:
                uri = (
                    "otpauth://totp/"
                    + quote("TailWag:" + current.USERNAME, safe="")
                    + "?secret="
                    + quote(secret, safe="")
                    + "&issuer=TailWag"
                )
                output = BytesIO()
                qrcode.make(uri).save(output, format="PNG")
                qr = base64.b64encode(output.getvalue()).decode()
            return render(
                "account.html",
                "Your account",
                secret=secret,
                qr=qr,
                enabled=bool(record.ENABLETOTP),
                forced=bool(main.session.get("force2fa")),
                error=main.session.get("foster_account_error", ""),
            )

        def POST(self):
            current = user()
            values = post()
            # Per-session credential re-verification bound, additional to login limit.
            now = time.monotonic()
            start, count = main.session.get("foster_account_attempts", (now, 0))
            if now - start > 600:
                start, count = now, 0
            if count >= 10:
                raise web.HTTPError(
                    "429 Too Many Requests", {}, "Too many attempts; try in ten minutes"
                )
            main.session.foster_account_attempts = (start, count + 1)
            db = main.session.dbo
            try:
                record = asm3.users.authenticate(
                    db, current.USERNAME, values.get("password", "")
                )
                if not record or record.DISABLELOGIN:
                    raise asm3.utils.ASMValidationError("Password is incorrect")
                action = values.get("action", "")
                if action == "password":
                    if main.session.get("force2fa") or not record.ENABLETOTP:
                        raise asm3.utils.ASMValidationError(
                            "Complete authenticator sign-in before changing your password"
                        )
                    asm3.users.change_password(
                        db,
                        current.USERNAME,
                        values.get("password", ""),
                        values.get("new_password", ""),
                    )
                    asm3.audit.edit(
                        db,
                        current.USERNAME,
                        "users",
                        current.ID,
                        "",
                        "Portal password changed; secret omitted",
                    )
                    asm3.users.logout(main.session)
                    raise web.seeother("/login")
                elif (
                    action == "prepare"
                    and not record.ENABLETOTP
                    and not record.OTPSECRET
                ):
                    asm3.users.update_user_otp_secret(
                        db, current.ID, asm3.utils.otp_secret()
                    )
                elif action == "enrol" and not record.ENABLETOTP and record.OTPSECRET:
                    code = values.get("code", "")
                    if not (
                        len(code) == 6
                        and code.isascii()
                        and code.isdigit()
                        and hmac.compare_digest(
                            code, str(asm3.utils.totp(record.OTPSECRET)).zfill(6)
                        )
                    ):
                        raise asm3.utils.ASMValidationError(
                            "Authenticator code is incorrect"
                        )
                    db.update(
                        "users",
                        current.ID,
                        {"EnableTOTP": 1},
                        current.USERNAME,
                        setLastChanged=False,
                    )
                    main.session.force2fa = False
                else:
                    raise asm3.utils.ASMValidationError(
                        "Account action is unavailable; reload or sign in again"
                    )
                main.session.foster_account_error = ""
            except asm3.utils.ASMValidationError as error:
                main.session.foster_account_error = error.msg
                web.ctx.status = "400 Bad Request"
                return self.GET()
            raise web.seeother("/foster")

    class Logout:
        def POST(self):
            # Keep logout available even when a carer account is disabled/misconfigured.
            post()
            asm3.users.logout(main.session)
            raise web.seeother("/login")

    # Session's processor was registered when native main was imported. Append
    # here so the canonical session is loaded before evaluating the gateway.
    main.app.add_processor(gateway)
    for path, handler in [
        ("/foster", Dashboard),
        ("/foster/animal/([0-9]+)", Animal),
        ("/foster/photo/([0-9]+)", Photo),
        ("/foster/account", Account),
        ("/foster/logout", Logout),
    ]:
        main.app.add_mapping(path, handler)

    original_show = Animal.show

    def show_with_notice(self, *args, **kwargs):
        kwargs.setdefault("success", main.session.get("foster_notice", ""))
        main.session.foster_notice = ""
        return original_show(self, *args, **kwargs)

    Animal.show = show_with_notice


def display(value):
    return value.strftime("%d %b %Y, %H:%M") if value else ""


def plain(row):
    # Native writes escape angle brackets. Decode once for text rendering, then
    # Django autoescapes every value; never mark canonical text HTML-safe.
    for key, value in row.items():
        if isinstance(value, str):
            row[key] = unescape(value)
    return row
