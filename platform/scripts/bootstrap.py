#!/usr/bin/env python3
"""Initialise an EMPTY core. Never reset existing operational records."""

import os, sys, json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
from shelter.core import database, FORM_NAMES
import asm3.dbupdate, asm3.configuration, asm3.users, asm3.onlineform, asm3.reports

password = os.environ.get("ADMIN_PASSWORD", "")
if len(password) < 16:
    raise SystemExit("ADMIN_PASSWORD must be at least 16 characters")
from shelter.accounts import validate_password

validate_password(password)
dbo = database(configured=False)
try:
    existing = dbo.query("SELECT ID FROM users")
except Exception:
    existing = None
if existing is not None:
    raise SystemExit("Bootstrap refused: core already exists")
for install in (
    asm3.dbupdate.install_db_structure,
    asm3.dbupdate.install_db_views,
    asm3.dbupdate.install_default_data,
    asm3.dbupdate.install_db_sequences,
    asm3.dbupdate.install_db_stored_procedures,
    asm3.dbupdate.install_default_templates,
):
    install(dbo)
if dbo.dbtype == "POSTGRESQL":
    dbo.execute("CREATE SEQUENCE IF NOT EXISTS tw_form_collation_id_seq")
for name in ("active_fosters.rep", "stock_levels.rep"):
    asm3.reports.install_smcom_report_file(
        dbo, "bootstrap", str(root / "vendor/asm/reports" / name)
    )
dbo.execute(
    "UPDATE users SET UserName = ?, Password = ?, RealName = ? WHERE ID = 1",
    [
        os.getenv("ADMIN_USERNAME", "care-admin"),
        asm3.users.hash_password(password),
        "Initial administrator",
    ],
)
dbo.execute("UPDATE users SET DisableLogin = 1 WHERE ID <> 1")
dbo.execute("UPDATE users SET EnableTOTP = 0 WHERE EnableTOTP IS NULL")
for key, val in {
    "Organisation": os.getenv("ORG_NAME", "TailWag Animal Care"),
    "OrganisationAddress": os.getenv("ORG_ADDRESS", ""),
    "OrganisationCountry": "United Kingdom",
    "EmailAddress": os.getenv("ORG_EMAIL", ""),
    "CurrencyCode": "GBP",
    "Locale": "en_GB",
    "Timezone": "0",
    "TimezoneDST": "Yes",
    "PublisherUseComments": "No",
    "ServiceEnabled": "No",
    "Force2FA": "Yes",
    "AuditOnViewRecord": "Yes",
    "AuditOnViewReport": "Yes",
    "EmailDiaryNotes": "No",
    "EmailMessages": "No",
    "AutoNewImagesNotForPublish": "Yes",
}.items():
    asm3.configuration.cset(dbo, key, val)
from shelter.roles import ROLES, security_map

for name, flags in ROLES.items():
    asm3.users.insert_role_from_form(
        dbo,
        "bootstrap",
        asm3.utils.PostedData(
            {"rolename": name, "securitymap": security_map(flags)}, dbo.locale
        ),
    )
from shelter.roles import restrict_default_reports

restrict_default_reports(dbo)
from shelter.extensions import migrate as migrate_extensions
from shelter.foster import install as install_foster

migrate_extensions(dbo)
install_foster(dbo)
asm3.configuration.cset(
    dbo, "TailWagFosterReviewUser", os.getenv("ADMIN_USERNAME", "care-admin")
)
for name in FORM_NAMES.values():
    fields = [
        {
            "name": key,
            "label": label,
            "type": "TEXT",
            "mandatory": False,
            "index": index,
            "lookups": "",
            "tooltip": "",
        }
        for index, (key, label) in enumerate(
            [
                ("firstname", "First name"),
                ("lastname", "Last name"),
                ("emailaddress", "Email"),
                ("message", "Enquiry"),
                ("animalname", "Animal"),
                ("capacity", "Household and capacity"),
                ("species", "Species"),
                ("privacy", "Privacy acknowledgement"),
                ("reference", "Public receipt reference"),
            ]
        )
    ]
    asm3.onlineform.import_onlineform_json(
        dbo,
        json.dumps(
            {
                "name": name,
                "description": "Manual team review; no automatic placement.",
                "header": "",
                "footer": "",
                "fields": fields,
            }
        ),
    )
print(
    "Empty core initialised. Default guest disabled. Enrol TOTP and configure responsibilities before use."
)
