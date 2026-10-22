#!/usr/bin/env python3
import json,pathlib,subprocess,sys,tempfile,os
root=pathlib.Path(__file__).resolve().parents[1];lock=json.loads((root/'upstream.json').read_text());target=root/'vendor/asm'
if not target.exists():
    target.mkdir(parents=True);subprocess.run(['git','init',str(target)],check=True,stdout=subprocess.DEVNULL)
    subprocess.run(['git','-C',str(target),'remote','add','origin',lock['repository']],check=True)
    subprocess.run(['git','-C',str(target),'fetch','--depth','1','origin',lock['commit']],check=True)
    subprocess.run(['git','-C',str(target),'checkout','--detach',lock['commit']],check=True)
if subprocess.check_output(['git','-C',str(target),'rev-parse','HEAD'],text=True).strip()!=lock['commit']:raise SystemExit('Core revision mismatch')
(root/'runtime').mkdir(exist_ok=True)
(target/'src/asm3/__version__.py').write_text(f'VERSION={lock["version"]!r}\nBUILD={lock["commit"][:12]!r}\n')
subprocess.run([sys.executable,str(root/'scripts/patch-core.py'),str(target)],check=True)
with tempfile.NamedTemporaryFile(mode='w') as config:
    config.write('log_location = stderr\nlog_debug = false\n');config.flush();env={**os.environ,'ASM3_CONF':config.name}
    subprocess.run([sys.executable,'scripts/schema/make_db.py'],cwd=target,env=env,check=True,stdout=subprocess.DEVNULL)
    bundle=target/'src/static/js/bundle';bundle.mkdir(exist_ok=True)
    with (bundle/'schema.js').open('w') as out:subprocess.run([sys.executable,'scripts/schema/schema.py'],cwd=target,env=env,check=True,stdout=out)
