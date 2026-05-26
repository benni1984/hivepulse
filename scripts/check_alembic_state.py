"""
Checks the current Alembic migration state of the database.

Prints one of:
  no_version_table  — alembic_version table doesn't exist (DB bootstrapped via create_all)
  no_version_row    — table exists but is empty
  <revision>        — the current head revision (e.g. "006")

Used by CI migration steps to decide whether to stamp before upgrading.
"""
import os
import sys

from sqlalchemy import create_engine, text

engine = create_engine(os.environ["DATABASE_URL"])
with engine.connect() as conn:
    r = conn.execute(
        text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM information_schema.tables"
            "  WHERE table_name='alembic_version'"
            ")"
        )
    )
    if not r.scalar():
        print("no_version_table")
        sys.exit(0)

    r2 = conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1"))
    row = r2.fetchone()
    print(row[0] if row else "no_version_row")
