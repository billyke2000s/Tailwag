#!/usr/bin/env python3
import os,sys,tempfile,pathlib,subprocess,secrets,shutil
import psycopg2
root=pathlib.Path(__file__).resolve().parents[1];name=os.environ['PGDATABASE']
if not name.endswith('_test'):raise SystemExit('Refused: database must end in _test')
kwargs=dict(host=os.environ['PGHOST'],port=os.getenv('PGPORT','5432'),user=os.environ['PGUSER'],password=os.environ['PGPASSWORD'])
with psycopg2.connect(dbname=name,**kwargs) as con:
    with con.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
        if cursor.fetchone()[0]:raise SystemExit('Refused: test database is not empty')
with tempfile.TemporaryDirectory(prefix='care-pg-test-') as tmp:
    env={**os.environ,'DEBUG':'true','TZ':'UTC','SECRET_KEY':secrets.token_urlsafe(48),'ADMIN_PASSWORD':secrets.token_urlsafe(24),'ASM3_CONF':tmp+'/asm3.conf','CORE_CACHE_DIR':tmp+'/cache'}
    def run(script,*args):subprocess.run([sys.executable,str(root/script),*args],env=env,cwd=root,check=True)
    run('scripts/configure.py');run('manage.py','migrate','--noinput');run('scripts/bootstrap.py');run('scripts/upgrade-core.py');run('manage.py','migrate','--check')
    os.environ.update(env);sys.path.insert(0,str(root))
    from shelter import core
    from shelter.locks import writer_lock
    data=dict(first_name='Synthetic',last_name='Postgres Test',email='postgres-test@example.invalid',message='Synthetic database verification')
    with writer_lock():first=core.submit('contact',data,'','127.0.0.1','Mozilla Test')
    with writer_lock():second=core.submit('contact',data,'','127.0.0.1','Mozilla Test')
    assert first!=second
    assert core.database().query_int('SELECT COUNT(DISTINCT CollationID) FROM onlineformincoming')==2
    subprocess.run(['pg_dump','--format=custom','--file',tmp+'/care.dump',name],env=env,check=True)
    admin=psycopg2.connect(dbname='postgres',**kwargs);admin.autocommit=True
    try:
        with admin.cursor() as cursor:
            cursor.execute('SELECT 1 FROM pg_database WHERE datname=%s',['tailwag_restore_test'])
            if cursor.fetchone():raise SystemExit('Refused: restore database already exists')
            cursor.execute('CREATE DATABASE tailwag_restore_test')
        subprocess.run(['pg_restore','--exit-on-error','--no-owner','--no-acl','--dbname','tailwag_restore_test',tmp+'/care.dump'],env=env,check=True)
        with psycopg2.connect(dbname='tailwag_restore_test',**kwargs) as restored:
            with restored.cursor() as cursor:cursor.execute('SELECT COUNT(DISTINCT CollationID) FROM onlineformincoming');assert cursor.fetchone()[0]==2
    finally:
        with admin.cursor() as cursor:cursor.execute('DROP DATABASE IF EXISTS tailwag_restore_test WITH (FORCE)')
        admin.close()
print('PostgreSQL installation, migration, shared IDs, submissions and restore passed')
