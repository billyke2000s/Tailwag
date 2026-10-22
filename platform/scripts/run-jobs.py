#!/usr/bin/env python3
"""Reviewed native daily tasks. No automatic deletion, holds expiry or publishing."""

import logging, os, sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(root), str(root / "vendor/asm/src")]
from shelter import core_runtime
from shelter.core import database
from shelter.locks import writer_lock
import asm3.animal, asm3.dbupdate, asm3.financial, asm3.person, asm3.lostfound
import asm3.diary, asm3.automail, asm3.reports


class FailureTracker(logging.Handler):
    failed = False

    def emit(self, record):
        if record.levelno >= logging.ERROR:
            self.failed = True


tracker = FailureTracker()
logging.getLogger("care.events").addHandler(tracker)
dbo = database()
with writer_lock():
    if asm3.dbupdate.check_for_updates(dbo) or asm3.dbupdate.check_for_view_seq_changes(
        dbo
    ):
        raise SystemExit("Schema maintenance required; refusing automatic migration")
    tasks = [
        asm3.animal.update_on_shelter_animal_statuses,
        asm3.animal.update_foster_animal_statuses,
        asm3.animal.update_boarding_animal_statuses,
        asm3.animal.update_on_shelter_variable_animal_data,
        asm3.animal.update_foster_variable_animal_data,
        asm3.animal.update_offshelter_young_variable_animal_data,
        asm3.financial.update_location_boarding_today,
        asm3.animal.update_animal_figures,
        asm3.animal.update_animal_figures_annual,
        asm3.animal.update_active_litters,
        asm3.person.update_lookingfor_report,
        asm3.lostfound.update_match_report,
    ]
    if os.getenv("NOTIFICATIONS_ENABLED", "false") == "true":
        if not os.getenv("SMTP_HOST") or not os.getenv("SMTP_FROM"):
            raise SystemExit(
                "Notification processing requires configured SMTP identity"
            )
        tasks += [
            asm3.diary.email_uncompleted_upto_today,
            asm3.automail.send_all,
            asm3.reports.email_daily_reports,
        ]
    for task in tasks:
        task(dbo)
        if tracker.failed:
            raise SystemExit("Daily task reported errors; reconcile before retrying")
print("reviewed_daily_routines_completed; delivery not implied")
