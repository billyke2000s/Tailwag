#!/usr/bin/env python3
import os,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from shelter.core import database
import asm3.users,asm3.audit
password=os.environ.get('NEW_PASSWORD','')
if len(password)<16:raise SystemExit('Set NEW_PASSWORD securely in the environment to at least 16 characters')
dbo=database();user=asm3.users.get_user(dbo,os.environ['RECOVER_USERNAME'])
if not user:raise SystemExit('Account not found')
asm3.users.reset_password(dbo,user['ID'],password)
asm3.audit.edit(dbo,'server-maintenance','users',user['ID'],'','Administrator-assisted recovery; TOTP requires re-enrolment')
print('Recovered account; re-enrol TOTP and review audit before returning access')
