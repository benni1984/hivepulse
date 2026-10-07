# Backend (FastAPI / Python)

- Entry point: `backend/main.py`
- Run dev server: `uvicorn main:app --reload` (from `backend/`)
- Run tests: `pytest` (from `backend/`)
- Database: SQLite for dev, PostgreSQL (Neon) for staging/production
- ORM: SQLAlchemy + Alembic migrations in `backend/alembic/versions/`
- Latest migration: `017_planned_treatments.py`

## Push notifications

Real delivery lives in `app/utils/push.py`: **FCM HTTP v1** for Android (service account →
OAuth2 access token, cached) and **APNs HTTP/2** for iPhones (ES256 provider token, cached
for 40 minutes because Apple refuses more frequent refreshes). Both return a `PushResult`;
`UNREGISTERED` makes the reminder run drop that token from the account.

Without credentials both senders log a warning and return `SKIPPED` — a cron run must never
fail for everyone because one channel is unconfigured. Setup steps for the Firebase and
Apple side are in `docs/push-setup.md`.

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
