# Backend (FastAPI / Python)

- Entry point: `backend/main.py`
- Run dev server: `uvicorn main:app --reload` (from `backend/`)
- Run tests: `pytest` (from `backend/`)
- Database: SQLite for dev, PostgreSQL (Neon) for staging/production
- ORM: SQLAlchemy + Alembic migrations in `backend/alembic/versions/`
- Latest migration: `006_add_hornet_traps.py`

## Endpoints & Tests

| Domain | Endpoints | Test file |
|--------|-----------|-----------|
| Auth | POST /auth/register, login, refresh, logout | test_auth.py |
| Users | GET/PUT/DELETE /users/me | test_users.py |
| Apiaries | CRUD /apiaries | test_apiaries.py |
| Hives | CRUD + QR resolve + QR image | test_hives.py |
| Inspections | CRUD /hives/{id}/inspections | test_inspections.py |
| Field Definitions | CRUD, user-scope and apiary-scope | test_field_definitions.py |
| QR Batches | Generate + PDF download | test_qr_batches.py |
| Stats | Hive / apiary / overview / community heatmap | test_stats.py |
| Public API | Global stats + apiary map pins | test_public.py |
| Hornet Tracker | Catches, nests, sightings, voting | test_hornets.py |
| Hornet Traps | Named traps, nearby search, daily catches | test_hornets.py |
| Admin | Stats, token mgmt, user list, sighting moderation | test_admin_*.py |
