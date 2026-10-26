"""Versioned technical metadata in the canonical database, never animal copies."""

from .transactions import native_transaction


def migrate(dbo):
    with native_transaction(dbo) as db:
        if db.dbtype == "POSTGRESQL":
            db.execute("SELECT pg_advisory_xact_lock(84521002)")
        db.execute(
            "CREATE TABLE IF NOT EXISTS tw_extension_migration "
            "(Version INTEGER PRIMARY KEY, AppliedAt TIMESTAMP NOT NULL)"
        )
        if not db.query_int(
            "SELECT COUNT(*) FROM tw_extension_migration WHERE Version = 1"
        ):
            db.execute(
                "CREATE TABLE tw_action_receipt (Token VARCHAR(36) PRIMARY KEY, "
                "ActorID INTEGER NOT NULL, Kind VARCHAR(32) NOT NULL, "
                "Fingerprint VARCHAR(64) NOT NULL, ResultID INTEGER NOT NULL, "
                "AuxID INTEGER NOT NULL, CreatedAt TIMESTAMP NOT NULL)"
            )
            db.execute(
                "INSERT INTO tw_extension_migration (Version, AppliedAt) VALUES (1, ?)",
                [db.now()],
            )
        if not db.query_int(
            "SELECT COUNT(*) FROM tw_extension_migration WHERE Version = 2"
        ):
            db.execute("CREATE TABLE tw_foster_account (UserID INTEGER PRIMARY KEY)")
            db.execute(
                "INSERT INTO tw_extension_migration (Version, AppliedAt) VALUES (2, ?)",
                [db.now()],
            )
