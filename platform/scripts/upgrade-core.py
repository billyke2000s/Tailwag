#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from shelter.core import database
import asm3.dbupdate
core=database()
if asm3.dbupdate.check_for_updates(core):
    _,failed=asm3.dbupdate.perform_updates(core)
    if failed:raise SystemExit('Migration failed; keep traffic stopped and restore a verified backup')
if asm3.dbupdate.check_for_view_seq_changes(core):
    if asm3.dbupdate.install_db_views(core) or asm3.dbupdate.install_db_sequences(core):raise SystemExit('View/sequence migration failed; keep traffic stopped')
    asm3.dbupdate.install_db_stored_procedures(core)
if asm3.dbupdate.check_for_updates(core) or asm3.dbupdate.check_for_view_seq_changes(core):raise SystemExit('Schema remains pending after upgrade')
print('Core schema current')
