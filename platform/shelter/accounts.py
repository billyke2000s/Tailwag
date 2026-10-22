"""Canonical native accounts with bounded password policy and legacy-hash upgrade."""

from functools import wraps
from django.contrib.auth.password_validation import CommonPasswordValidator
import asm3.users, asm3.utils

_common = CommonPasswordValidator().passwords


def validate_password(password):
    if (
        not 14 <= len(password) <= 512
        or password.isdigit()
        or password.lower().strip() in _common
    ):
        raise asm3.utils.ASMValidationError(
            "Use a unique passphrase of 14–512 characters that is not common or entirely numeric."
        )


original_insert = asm3.users.insert_user_from_form


@wraps(original_insert)
def insert(dbo, username, post):
    validate_password(post["password"])
    return original_insert(dbo, username, post)


asm3.users.insert_user_from_form = insert

original_change = asm3.users.change_password


@wraps(original_change)
def change(dbo, username, oldpassword, newpassword):
    validate_password(newpassword)
    return original_change(dbo, username, oldpassword, newpassword)


asm3.users.change_password = change

original_reset = asm3.users.reset_password


@wraps(original_reset)
def reset(dbo, userid, password):
    validate_password(password)
    return original_reset(dbo, userid, password)


asm3.users.reset_password = reset

original_authenticate = asm3.users.authenticate


@wraps(original_authenticate)
def authenticate(dbo, username, password):
    if len(username) > 200 or len(password) > 512:
        return None
    user = original_authenticate(dbo, username, password)
    if user and not user.get("DISABLELOGIN"):
        parts = user["PASSWORD"].split(":")
        current = (
            len(parts) == 5
            and parts[0] == "pbkdf2"
            and parts[1] == "sha256"
            and int(parts[3]) >= 600000
        )
        if not current:
            newhash = asm3.users.hash_password(password)
            dbo.update("users", user["ID"], {"Password": newhash}, setLastChanged=False)
            user["PASSWORD"] = newhash
    return user


asm3.users.authenticate = authenticate


def credential_stamp(dbo, username):
    import hashlib

    value = dbo.query_string(
        "SELECT Password FROM users WHERE UserName = ?", [username]
    )
    return hashlib.sha256(value.encode()).hexdigest() if value else ""


original_login = asm3.users.web_login


@wraps(original_login)
def login(post, session, remoteip, useragent, path, use2fa=True):
    result = original_login(post, session, remoteip, useragent, path, use2fa)
    if session.get("user") and result.split("|")[0] == session.user:
        session.credential_stamp = credential_stamp(session.dbo, session.user)
    return result


asm3.users.web_login = login
