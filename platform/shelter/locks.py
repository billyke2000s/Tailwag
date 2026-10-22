from contextlib import contextmanager
import os, fcntl
from pathlib import Path


@contextmanager
def writer_lock():
    if os.getenv("PGHOST"):
        import psycopg2

        con = psycopg2.connect(
            host=os.environ["PGHOST"],
            port=os.getenv("PGPORT", "5432"),
            dbname=os.environ["PGDATABASE"],
            user=os.environ["PGUSER"],
            password=os.environ["PGPASSWORD"],
        )
        try:
            cursor = con.cursor()
            cursor.execute("SET lock_timeout='15s'")
            cursor.execute("SELECT pg_advisory_lock(84521001)")
            yield
        finally:
            con.close()
    else:
        with (Path(__file__).resolve().parent.parent / "runtime" / "writer.lock").open(
            "a"
        ) as handle:
            fcntl.flock(handle, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(handle, fcntl.LOCK_UN)
