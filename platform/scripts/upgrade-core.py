#!/usr/bin/env python3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from shelter.core import database
import asm3.dbupdate

core = database()
if asm3.dbupdate.check_for_updates(core):
    _, failed = asm3.dbupdate.perform_updates(core)
    if failed:
        raise SystemExit(
            "Migration failed; keep traffic stopped and restore a verified backup"
        )
if asm3.dbupdate.check_for_view_seq_changes(core):
    if asm3.dbupdate.install_db_views(core) or asm3.dbupdate.install_db_sequences(core):
        raise SystemExit("View/sequence migration failed; keep traffic stopped")
    asm3.dbupdate.install_db_stored_procedures(core)
if asm3.dbupdate.check_for_updates(core) or asm3.dbupdate.check_for_view_seq_changes(
    core
):
    raise SystemExit("Schema remains pending after upgrade")
# Idempotent adapter data upgrade: preserve existing forms and their decisions.
import asm3.onlineform, asm3.utils
from shelter.core import FORM_NAMES

for name in FORM_NAMES.values():
    formid = core.query_int("SELECT ID FROM onlineform WHERE Name = ?", [name])
    if formid and not core.query_int(
        "SELECT COUNT(*) FROM onlineformfield WHERE OnlineFormID = ? AND FieldName = 'reference'",
        [formid],
    ):
        asm3.onlineform.insert_onlineformfield_from_form(
            core,
            "platform-upgrade",
            asm3.utils.PostedData(
                {
                    "formid": str(formid),
                    "fieldname": "reference",
                    "fieldtype": "0",
                    "label": "Public receipt reference",
                    "displayindex": "99",
                },
                core.locale,
            ),
        )
from shelter.roles import restrict_default_reports

restrict_default_reports(core)
from shelter.extensions import migrate as migrate_extensions
from shelter.foster import install as install_foster

migrate_extensions(core)
install_foster(core)
print("Core schema and adapter form metadata current")
