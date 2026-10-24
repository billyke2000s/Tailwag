"""A bounded transaction adapter for the pinned native database interface."""

from contextlib import contextmanager
from copy import copy


class DeferredConnection:
    """Native statements commit individually; defer those commits to the owner."""

    def __init__(self, connection):
        self.connection = connection
        self.failed = False

    def __getattr__(self, name):
        return getattr(self.connection, name)

    def commit(self):
        pass

    def rollback(self):
        self.failed = True
        self.connection.rollback()

    def close(self):
        pass


@contextmanager
def native_transaction(dbo):
    if dbo.dbtype not in ("SQLITE", "POSTGRESQL") or dbo.locked:
        raise RuntimeError("Care writes require an unlocked supported database")
    # Never mutate the session's dbo: concurrent requests can share that object.
    db = copy(dbo)
    connection = dbo.connect()
    proxy = DeferredConnection(connection)
    db.connection = proxy
    try:
        if dbo.dbtype == "SQLITE":
            connection.execute("BEGIN IMMEDIATE")
        yield db
        if proxy.failed:
            raise RuntimeError(
                "A native statement failed; care transaction rolled back"
            )
        connection.commit()
    except BaseException:
        connection.rollback()
        raise
    finally:
        connection.close()
