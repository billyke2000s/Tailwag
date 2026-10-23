#!/usr/bin/env python3
"""Reproducible GPL modifications; fail closed if upstream anchors change."""

import pathlib, sys

root = pathlib.Path(sys.argv[1])


def replace(file, old, new):
    path = root / file
    text = path.read_text()
    if new in text:
        return
    if text.count(old) != 1:
        raise RuntimeError(f"Patch no longer applies: {file}")
    path.write_text(text.replace(old, new))


replace(
    "src/asm3/utils.py",
    '''class ASMValidationError(web.HTTPError):
    """
    Custom error thrown by data modules when validation fails
    """
    msg = ""
    def __init__(self, msg: str) -> None:
        self.msg = msg
        status = '500 Internal Server Error'
'''.rstrip(),
    '''class ASMValidationError(web.HTTPError):
    """
    Custom error thrown by data modules when validation fails
    """
    msg = ""
    def __init__(self, msg: str) -> None:
        self.msg = msg
        status = '400 Bad Request'
'''.rstrip(),
)


replace(
    "src/asm3/users.py",
    'asm3.al.error("database:%s username:%s password:%s failed authentication from %s [%s]" % (database, username, password, remoteip, useragent), "users.web_login", dbo)',
    'asm3.al.error("authentication_failed", "users.web_login", dbo)',
)
replace(
    "src/asm3/users.py",
    'rememberme = post["rememberme"] == "on"',
    "rememberme = False # TailWag: do not cache plaintext credentials",
)
replace(
    "src/asm3/onlineform.py",
    'asm3.al.error(f"spam detected ({spamreason}): {post.data}", "insert_onlineformincoming_from_form", dbo)',
    'asm3.al.error("submission_flagged_for_review", "insert_onlineformincoming_from_form", dbo)',
)
replace(
    "src/asm3/onlineform.py",
    'asm3.al.warn("failed creating incoming field, cid=%s, name=%s, value=%s: %s" % (collationid, fieldname, v, err),',
    'asm3.al.warn("incoming_field_write_failed cid=%s" % collationid,',
)
replace(
    "src/asm3/html.py",
    'asm_css_tag("asm-pos.css")',
    'asm_css_tag("asm-pos.css") + asm_css_tag("tailwag.css")',
)
replace(
    "src/static/js/login.js",
    "The default username is 'user' with the password 'letmein'",
    "Sign in with the administrator account configured during setup.",
)
replace(
    "src/static/js/main.js",
    "When you use Move > Foster an animal, ASM will automatically return any open foster movement before moving the animal to its new home.",
    "Return an existing foster placement explicitly before arranging a new foster home.",
)
replace(
    "src/static/js/change_user_settings.js",
    '$("#button-enable2fa").toggle(u.ENABLETOTP == 0);',
    '$("#button-enable2fa").toggle(u.ENABLETOTP != 1);',
)
replace(
    "src/asm3/cachedisk.py",
    '        os.unlink(fname)\n    except Exception as err:\n        asm3.al.error(str(err), "cachedisk.delete")',
    '        os.unlink(fname)\n    except FileNotFoundError:\n        pass # An absent cache entry is an expected invalidation result\n    except Exception as err:\n        asm3.al.error(str(err), "cachedisk.delete")',
)
(root / "src/static/css/tailwag.css").write_text(
    (pathlib.Path(__file__).resolve().parents[1] / "static/staff.css").read_text()
)

replace(
    "src/asm3/users.py",
    "if twofavalidcode == str(asm3.utils.totp(user.OTPSECRET)):",
    "if twofavalidcode == str(asm3.utils.totp(user.OTPSECRET)).zfill(6):",
)
replace(
    "src/asm3/users.py",
    "if onetimepass != str(asm3.utils.totp(user.OTPSECRET)):",
    "if onetimepass != str(asm3.utils.totp(user.OTPSECRET)).zfill(6):",
)

replace(
    "src/static/js/main.js",
    "When you use Move > Adopt an animal, ASM will automatically return any open foster or retailer movement before creating the adoption.",
    "Return the existing placement explicitly before creating an adoption. Keep the return reason and date in the animal history.",
)

replace(
    "src/asm3/dbupdate.py",
    "return asm3.configuration.db_view_seq_version(dbo) != str(_dbupdates_latest_ver(dbo))",
    "return asm3.configuration.db_view_seq_version(dbo) != _dbupdates_latest_ver(dbo)",
)

replace(
    "src/asm3/utils.py",
    'Custom error thrown by data modules when permission checks fail\n    """\n    msg = ""\n    def __init__(self, msg: str) -> None:\n        self.msg = msg\n        status = \'500 Internal Server Error\'',
    'Custom error thrown by data modules when permission checks fail\n    """\n    msg = ""\n    def __init__(self, msg: str) -> None:\n        self.msg = msg\n        status = \'403 Forbidden\'',
)

# Reviewed browser libraries; fetch-browser-assets.py verifies the distribution hashes.
replace(
    "src/asm3/sitedefs.py",
    "static/lib/jquery/3.7.0/jquery.min.js",
    "static/lib/tailwag-supported/jquery/dist/jquery.min.js",
)
replace(
    "src/asm3/sitedefs.py",
    "static/lib/jqueryui/jquery-ui-1.13.2/jquery-ui.min.js",
    "static/lib/tailwag-supported/jquery-ui/jquery-ui.min.js",
)
replace(
    "src/asm3/sitedefs.py",
    "static/lib/moment/2.29.1/moment.min.js",
    "static/lib/tailwag-supported/moment/min/moment.min.js",
)
replace(
    "src/asm3/sitedefs.py",
    "static/lib/tinymce/5.5.1/tinymce/js/tinymce/tinymce.min.js",
    "static/lib/tailwag-supported/tinymce/tinymce.min.js",
)
for file in ["src/static/js/common_widgets.js", "src/static/js/document_edit.js"]:
    replace(
        file,
        "tinymce.init({",
        'tinymce.init({\n            license_key: "gpl",\n            promotion: false,',
    )
    replace(file, "fontselect fontsizeselect", "fontfamily fontsize")
    replace(file, "fontsize_formats:", "font_size_formats:")
replace("src/static/js/document_edit.js", "font_formats:", "font_family_formats:")
replace(
    "src/static/js/document_edit.js",
    "toolbar1: readonly ? ro_toolbar : rw_toolbar,",
    "toolbar: readonly ? ro_toolbar : rw_toolbar,",
)
replace(
    "src/static/js/common_widgets.js",
    '''                "advlist autolink lists link image charmap code ",
                "hr anchor searchreplace visualblocks visualchars ",
                "insertdatetime media nonbreaking table directionality",
                "emoticons template paste"''',
    '''                "advlist", "autolink", "lists", "link", "image", "charmap", "code",
                "anchor", "searchreplace", "visualblocks", "visualchars",
                "insertdatetime", "media", "nonbreaking", "table", "directionality", "emoticons"''',
)
replace(
    "src/static/js/document_edit.js",
    '''            "advlist directionality lists link image charmap print preview",
            "hr anchor pagebreak searchreplace wordcount visualblocks visualchars code fullscreen",
            "insertdatetime media nonbreaking save table contextmenu directionality",
            "emoticons paste textcolor save"''',
    '''            "advlist", "directionality", "lists", "link", "image", "charmap", "preview",
            "anchor", "pagebreak", "searchreplace", "wordcount", "visualblocks", "visualchars", "code", "fullscreen",
            "insertdatetime", "media", "nonbreaking", "save", "table", "emoticons"''',
)
replace(
    "src/static/js/document_edit.js",
    """        setup: function(ed) {

            // Add a PDF button""",
    """        setup: function(ed) {
            // Print is no longer a separately distributed TinyMCE plugin.
            ed.addCommand("mcePrint", function() { ed.getWin().focus(); ed.getWin().print(); });
            ed.ui.registry.addButton("print", { icon: "print", tooltip: "Print", onAction: function() { ed.execCommand("mcePrint"); } });

            // Add a PDF button""",
)

replace("src/asm3/users.py", "PBKDF2_ITERATIONS = 10000", "PBKDF2_ITERATIONS = 600000")
replace("src/asm3/users.py", 'PBKDF2_ALGORITHM = "sha1"', 'PBKDF2_ALGORITHM = "sha256"')
replace(
    "src/asm3/users.py", "import os\nimport sys", "import os\nimport sys\nimport hmac"
)
replace(
    "src/asm3/users.py",
    "return asm3.utils.pbkdf2_hash_hex(plaintext, salt, algorithm, int(iterations)) == phash",
    "return hmac.compare_digest(asm3.utils.pbkdf2_hash_hex(plaintext, salt, algorithm, int(iterations)), phash)",
)
# The legacy email reset changes a password on GET and emails a plaintext secret.
# Recovery is deliberately an authenticated administrator/server operation here.
path = root / "src/main.py"
text = path.read_text()
recovery_guard = '    def post_reset(self, o):\n        raise asm3.utils.ASMPermissionError("Contact the organisation administrator for account recovery")\n'
if recovery_guard not in text:
    start = text.index(
        '    def post_reset(self, o):\n        dbo = asm3.db.get_database(o.post["database"])'
    )
    end = text.index("\nclass logout(ASMEndpoint):", start)
    text = text[:start] + recovery_guard + text[end:]
    path.write_text(text)
replace(
    "src/static/js/login.js",
    '<span id="resetpassword" style="display: none; margin-top: 5px;"><a href="#">Reset my password</a></span>',
    "<p>Need account recovery? Contact your organisation administrator.</p>",
)
path = root / "src/main.py"
text = path.read_text()
reset_guard = 'class reset_password(ASMEndpoint):\n    url = "reset_password"\n    check_logged_in = False\n\n    def content(self, o):\n        raise asm3.utils.ASMPermissionError("Contact the organisation administrator for account recovery")\n'
if reset_guard not in text:
    start = text.index("class reset_password(ASMEndpoint):")
    end = text.index("\nclass accounts(JSONEndpoint):", start)
    text = text[:start] + reset_guard + text[end:]
    path.write_text(text)
replace(
    "src/asm3/utils.py",
    """    hashfunc = getattr(hashlib, algorithm)
    import asm3.pbkdf2.pbkdf23
    return str(asm3.pbkdf2.pbkdf23.pbkdf2(hashfunc, str2bytes(plaintext), str2bytes(salt), iterations, 24).hex())""",
    """    return hashlib.pbkdf2_hmac(algorithm, str2bytes(plaintext), str2bytes(salt), iterations, dklen=24).hex()""",
)
replace(
    "src/main.py",
    """        asm3.al.debug("%s changed settings: theme=%s, locale=%s, realname=%s, email=%s, quicklinks=%s, twofacode=%s, twofapass=%s" % (o.user, theme, locale, realname, email, quicklinks, twofavalidcode, twofavalidpassword), "main.change_password", o.dbo)""",
    """        asm3.al.debug("Account settings changed", "main.change_user_settings", o.dbo)""",
)
