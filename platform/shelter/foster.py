"""Fresh foster-only projections and bounded canonical log/diary actions."""

import hashlib
import hmac
import json
import os
import uuid

import asm3.configuration
import asm3.diary
import asm3.i18n
import asm3.log
import asm3.users
import asm3.utils

from .transactions import native_transaction

ROLE_NAME = "Foster carer (portal only)"
ROLE_KEY = "TailWagFosterPortalRoleID"
LOG_KEY = "TailWagFosterObservationTypeID"


def install(dbo):
    """Create unassigned, permission-free role; keep its stable ID on upgrades."""
    if not asm3.configuration.cint(dbo, ROLE_KEY):
        # Never reinterpret an existing same-name role with unknown permissions.
        if dbo.query_int("SELECT COUNT(*) FROM role WHERE RoleName = ?", [ROLE_NAME]):
            raise RuntimeError(
                "Foster portal role name already exists; administrator review required"
            )
        rid = asm3.users.insert_role_from_form(
            dbo,
            "platform-upgrade",
            asm3.utils.PostedData(
                {"rolename": ROLE_NAME, "securitymap": ""}, dbo.locale
            ),
        )
        asm3.configuration.cset(dbo, ROLE_KEY, str(rid))
    if not asm3.configuration.cint(dbo, LOG_KEY):
        lid = dbo.insert(
            "logtype", {"LogTypeName": "Foster observation"}, setCreated=False
        )
        asm3.configuration.cset(dbo, LOG_KEY, str(lid))
    rid = asm3.configuration.cint(dbo, ROLE_KEY)
    dbo.execute(
        "INSERT INTO tw_foster_account (UserID) SELECT DISTINCT ur.UserID FROM userrole ur "
        "WHERE ur.RoleID = ? AND NOT EXISTS (SELECT 1 FROM tw_foster_account f WHERE f.UserID = ur.UserID)",
        [rid],
    )


def register_account(dbo, userid, proposed_roles=""):
    rid = asm3.configuration.cint(dbo, ROLE_KEY)
    if not rid:
        return
    roles = [part.strip() for part in proposed_roles.split(",")]
    if str(rid) in roles or dbo.query_int(
        "SELECT COUNT(*) FROM userrole WHERE UserID = ? AND RoleID = ?", [userid, rid]
    ):
        dbo.execute(
            "INSERT INTO tw_foster_account (UserID) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM tw_foster_account WHERE UserID = ?)",
            [userid, userid],
        )


def identity(dbo, username):
    """None for staff; a valid portal identity or a permission failure for carers."""
    rid = asm3.configuration.cint(dbo, ROLE_KEY)
    rows = dbo.query(
        "SELECT ID, UserName, OwnerID, SuperUser, DisableLogin FROM users WHERE UserName = ?",
        [username],
    )
    if not rows:
        raise asm3.utils.ASMPermissionError("Account is unavailable")
    user = rows[0]
    roles = dbo.query(
        "SELECT r.ID, r.SecurityMap FROM role r INNER JOIN userrole ur ON ur.RoleID = r.ID "
        "WHERE ur.UserID = ?",
        [user.ID],
    )
    marked = dbo.query_int(
        "SELECT COUNT(*) FROM tw_foster_account WHERE UserID = ?", [user.ID]
    )
    portal_role = any(r.ID == rid for r in roles)
    if not marked and not portal_role:
        return None
    if (
        not marked
        or not portal_role
        or len(roles) != 1
        or (roles[0].SECURITYMAP or "").strip()
        or user.SUPERUSER
        or user.DISABLELOGIN
        or not user.OWNERID
        or not dbo.query_int("SELECT COUNT(*) FROM owner WHERE ID = ?", [user.OWNERID])
    ):
        raise asm3.utils.ASMPermissionError(
            "Portal account configuration needs administrator review"
        )
    return user


def animals(dbo, user, animal_id=None):
    params = [user.OWNERID, dbo.today(), dbo.today(), dbo.today(), dbo.today()]
    extra = ""
    if animal_id is not None:
        extra = " AND a.ID = ?"
        params.append(animal_id)
    # Do not use session.visibleanimalids: it is only computed at native login.
    return dbo.query(
        "SELECT a.ID, a.AnimalName, a.ShelterCode, s.SpeciesName, "
        "CASE WHEN EXISTS (SELECT 1 FROM media p WHERE p.LinkTypeID = 0 AND p.LinkID = a.ID "
        "AND p.WebsitePhoto = 1 AND p.MediaMimeType = 'image/jpeg') THEN 1 ELSE 0 END AS HasPhoto FROM animal a "
        "LEFT JOIN species s ON s.ID = a.SpeciesID WHERE a.DeceasedDate IS NULL "
        "AND EXISTS (SELECT 1 FROM adoption m WHERE m.AnimalID = a.ID "
        "AND m.MovementType = 2 AND m.OwnerID = ? AND m.MovementDate <= ? "
        "AND (m.ReturnDate IS NULL OR m.ReturnDate > ?)) "
        "AND (SELECT COUNT(*) FROM adoption active WHERE active.AnimalID = a.ID "
        "AND active.MovementType > 0 AND active.MovementDate <= ? "
        "AND (active.ReturnDate IS NULL OR active.ReturnDate > ?)) = 1"
        + extra
        + " ORDER BY a.AnimalName, a.ID",
        params,
    )


def require_animal(dbo, user, animal_id):
    rows = animals(dbo, user, animal_id)
    if not rows:
        raise asm3.utils.ASMPermissionError(
            "Animal is not currently assigned to this household"
        )
    return rows[0]


def tasks(dbo, user, animal_id):
    require_animal(dbo, user, animal_id)
    # Explicitly assigned diary content only; not internal Comments or other diaries.
    return dbo.query(
        "SELECT ID, Subject, Note, DiaryDateTime, DateCompleted FROM diary "
        "WHERE LinkType = 1 AND LinkID = ? AND DiaryForName = ? "
        "ORDER BY DiaryDateTime DESC, ID DESC LIMIT 100",
        [animal_id, user.USERNAME],
    )


def task_version(user, row):
    value = json.dumps([user.ID, dict(row)], sort_keys=True, default=str).encode()
    return hmac.new(
        os.environ["SECRET_KEY"].encode(), value, hashlib.sha256
    ).hexdigest()


def observations(dbo, user, animal_id):
    require_animal(dbo, user, animal_id)
    return dbo.query(
        "SELECT l.ID, l.Date, l.Comments, d.DateCompleted FROM log l "
        "INNER JOIN tw_action_receipt r ON r.ResultID = l.ID AND r.Kind = 'observation' "
        "LEFT JOIN diary d ON d.ID = r.AuxID WHERE l.LinkType = 0 AND l.LinkID = ? "
        "AND r.ActorID = ? ORDER BY l.Date DESC, l.ID DESC LIMIT 50",
        [animal_id, user.ID],
    )


def _reviewer(dbo):
    name = asm3.configuration.cstring(dbo, "TailWagFosterReviewUser").strip()
    rows = dbo.query(
        "SELECT ID, DisableLogin, SuperUser FROM users WHERE UserName = ?", [name]
    )
    if not name or not rows or rows[0].DISABLELOGIN or identity(dbo, name) is not None:
        raise asm3.utils.ASMValidationError(
            "Staff review is unavailable; contact the organisation directly"
        )
    permissions = asm3.users.get_security_map(dbo, rows[0].ID)
    if not rows[0].SUPERUSER and any(
        flag + " *" not in permissions
        for flag in (asm3.users.VIEW_LOG, asm3.users.VIEW_DIARY)
    ):
        raise asm3.utils.ASMValidationError(
            "Staff reviewer permissions need administrator review"
        )
    return name


def act(dbo, username, animal_id, token, kind, text="", task_id=0, version=""):
    """A receipt and canonical writes commit together; replays never repeat actions."""
    try:
        if str(uuid.UUID(token)) != token:
            raise ValueError
    except (ValueError, TypeError, AttributeError):
        raise asm3.utils.ASMValidationError("Reload the form before submitting")
    text = text.strip()
    if kind not in ("observation", "task") or (
        kind == "observation" and not 5 <= len(text) <= 5000
    ):
        raise asm3.utils.ASMValidationError("Enter an observation of 5–5000 characters")
    digest = hashlib.sha256(
        json.dumps([animal_id, kind, text, task_id, version]).encode()
    ).hexdigest()
    with native_transaction(dbo) as db:
        # Cooperating native writes also take the WSGI writer lock. This row lock
        # serialises simultaneous portal requests on PostgreSQL independently.
        user = identity(db, username)
        if user is None:
            raise asm3.utils.ASMPermissionError("A portal-only account is required")
        if db.dbtype == "POSTGRESQL":
            db.query("SELECT ID FROM users WHERE ID = ? FOR UPDATE", [user.ID])
        require_animal(db, user, animal_id)
        previous = db.query("SELECT * FROM tw_action_receipt WHERE Token = ?", [token])
        if previous:
            receipt = previous[0]
            if (
                receipt.ACTORID != user.ID
                or receipt.KIND != kind
                or receipt.FINGERPRINT != digest
            ):
                raise asm3.utils.ASMValidationError(
                    "Submission reference was already used; reload the page"
                )
            return receipt.RESULTID, receipt.AUXID
        if kind == "observation":
            reviewer = _reviewer(db)
            date = asm3.i18n.python2display(db.locale, db.today())
            logtype = asm3.configuration.cint(db, LOG_KEY)
            if not db.query_int("SELECT COUNT(*) FROM logtype WHERE ID = ?", [logtype]):
                raise asm3.utils.ASMValidationError(
                    "Observation setup needs administrator review"
                )
            result = asm3.log.insert_log_from_form(
                db,
                username,
                0,
                animal_id,
                asm3.utils.PostedData(
                    {
                        "type": str(logtype),
                        "logdate": date,
                        "logtime": db.now().strftime("%H:%M:%S"),
                        "entry": text,
                    },
                    db.locale,
                ),
            )
            aux = asm3.diary.insert_diary_from_form(
                db,
                username,
                asm3.diary.ANIMAL,
                animal_id,
                asm3.utils.PostedData(
                    {
                        "diarydate": date,
                        "diaryfor": reviewer,
                        "subject": "Review foster observation",
                        "note": f"Review animal log entry #{result}. This task does not change treatment instructions.",
                    },
                    db.locale,
                ),
            )
        else:
            rows = db.query(
                "SELECT ID, Subject, Note, DiaryDateTime, DateCompleted FROM diary WHERE ID = ? AND LinkType = 1 "
                "AND LinkID = ? AND DiaryForName = ?",
                [task_id, animal_id, username],
            )
            if not rows or rows[0].DATECOMPLETED:
                raise asm3.utils.ASMValidationError(
                    "Task is unavailable or already completed; reload the page"
                )
            if not hmac.compare_digest(version, task_version(user, rows[0])):
                raise asm3.utils.ASMValidationError(
                    "Task instructions changed; reload and review them before completing"
                )
            db.update("diary", task_id, {"DateCompleted": db.now()}, username)
            result, aux = task_id, 0
        db.execute(
            "INSERT INTO tw_action_receipt (Token, ActorID, Kind, Fingerprint, ResultID, AuxID, CreatedAt) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            [token, user.ID, kind, digest, result, aux, db.now()],
        )
        return result, aux
