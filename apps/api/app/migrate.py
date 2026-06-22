"""Apply pending SQL migrations on startup.

Reads ``apps/api/migrations/NNN_*.sql`` in numeric order and applies any
that haven't yet run, tracked via a ``schema_migrations`` table.

Designed to be invoked from the container CMD before uvicorn starts. A
failure here MUST fail the pod start — silently continuing with a
half-migrated schema (the previous behaviour) caused the 24-hour outage
on the v0.9.1 rollout.

Idempotent: re-running with no pending migrations is a no-op. Safe
under concurrent invocations because each migration acquires an
ACCESS EXCLUSIVE lock implicitly via DDL and the ``schema_migrations``
INSERT is wrapped in the same transaction.

Closes #229.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from loguru import logger
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.config import settings


MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"
MIGRATION_PATTERN = re.compile(r"^(\d{3})_.+\.sql$")


def ensure_migrations_table(engine: Engine) -> None:
    """Create ``schema_migrations`` if missing and backfill existing rows.

    On a brand-new DB the table is empty and migrations 001+ all run.
    On an existing DB (where the SQL was previously applied by hand)
    we detect that by checking for marker columns and pre-record the
    migrations so they don't re-run.
    """
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """))

        # Backfill marker. If the table already had its 001-003-era
        # columns before schema_migrations existed, treat those
        # migrations as applied so we don't try to re-run them and
        # blow up on ``column already exists``.
        existing = {row[0] for row in conn.execute(text(
            "SELECT version FROM schema_migrations"
        ))}

        # Inspect the live schema for proof that each pre-tracking
        # migration ran. If columns/indexes are present, the migration
        # was applied (manually). Mark accordingly.
        markers = [
            ("001_add_age_columns",
             "SELECT 1 FROM information_schema.columns "
             "WHERE table_name='sessions' AND column_name='age_max'"),
            ("002_add_is_free_entry",
             "SELECT 1 FROM information_schema.columns "
             "WHERE table_name='facilities' AND column_name='is_free_entry'"),
            ("003_add_pool_type_flags",
             "SELECT 1 FROM information_schema.columns "
             "WHERE table_name='facilities' AND column_name='has_indoor'"),
            ("004_add_toronto_location_id",
             "SELECT 1 FROM information_schema.columns "
             "WHERE table_name='facilities' AND column_name='toronto_location_id'"),
        ]
        for version, probe in markers:
            if version in existing:
                continue
            present = conn.execute(text(probe)).first() is not None
            if present:
                conn.execute(
                    text("INSERT INTO schema_migrations (version) VALUES (:v)"),
                    {"v": version},
                )
                logger.info(f"Backfilled schema_migrations: {version} (already applied)")


def list_migration_files() -> list[Path]:
    """Return migration files sorted by their NNN_ prefix."""
    if not MIGRATIONS_DIR.is_dir():
        logger.warning(f"Migrations dir not found: {MIGRATIONS_DIR}")
        return []
    files = []
    for f in MIGRATIONS_DIR.iterdir():
        m = MIGRATION_PATTERN.match(f.name)
        if m:
            files.append(f)
    files.sort(key=lambda p: p.name)
    return files


def applied_versions(engine: Engine) -> set[str]:
    with engine.begin() as conn:
        return {row[0] for row in conn.execute(text(
            "SELECT version FROM schema_migrations"
        ))}


def apply_migration(engine: Engine, path: Path) -> None:
    """Apply a single migration file inside one transaction.

    Both the DDL and the schema_migrations INSERT commit together; if
    the DDL fails, the INSERT rolls back and the next pod start tries
    again rather than skipping.
    """
    version = path.stem
    sql = path.read_text()
    logger.info(f"Applying migration: {version}")
    with engine.begin() as conn:
        # ``exec_driver_sql`` runs the SQL as a multi-statement script
        # exactly as written; SQLAlchemy's text() splits on semicolons
        # which breaks DO blocks and CTEs.
        conn.exec_driver_sql(sql)
        conn.execute(
            text("INSERT INTO schema_migrations (version) VALUES (:v)"),
            {"v": version},
        )
    logger.success(f"Migration applied: {version}")


def run() -> None:
    """Apply all pending migrations. Exits non-zero on any failure."""
    logger.info(f"Migration runner starting; dir = {MIGRATIONS_DIR}")
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    try:
        ensure_migrations_table(engine)
        applied = applied_versions(engine)
        files = list_migration_files()
        pending = [f for f in files if f.stem not in applied]

        if not pending:
            logger.info(f"No pending migrations ({len(applied)} already applied)")
            return

        logger.info(f"Pending migrations: {[f.name for f in pending]}")
        for f in pending:
            apply_migration(engine, f)
        logger.success(f"All {len(pending)} pending migrations applied")
    finally:
        engine.dispose()


if __name__ == "__main__":
    try:
        run()
    except Exception:
        logger.exception("Migration failed; aborting startup")
        sys.exit(1)
