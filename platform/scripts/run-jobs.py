#!/usr/bin/env python3
import logging,os,runpy,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];sys.path[:0]=[str(root),str(root/'vendor/asm/src')]
from shelter import core_runtime
from shelter.core import database
from shelter.locks import writer_lock
import asm3.dbupdate,asm3.reports,asm3.utils
asm3.utils.get_asm_news=lambda dbo:None
asm3.reports.update_smcom_reports=lambda dbo:None
class FailureTracker(logging.Handler):
    failed=False
    def emit(self,record):
        if record.levelno>=logging.ERROR:self.failed=True
tracker=FailureTracker();logging.getLogger('care.events').addHandler(tracker);dbo=database()
if asm3.dbupdate.check_for_updates(dbo) or asm3.dbupdate.check_for_view_seq_changes(dbo):raise SystemExit('Schema maintenance required; refusing automatic migration')
namespace=runpy.run_path(str(root/'vendor/asm/src/cron.py'),run_name='tailwag_cron')
with writer_lock():os.chdir(root/'vendor/asm/src');namespace['run'](dbo,'all')
if tracker.failed:raise SystemExit('Daily routines reported errors; reconcile before retrying')
print('daily_routines_completed; external delivery needs separate verification')
