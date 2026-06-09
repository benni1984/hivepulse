---
name: new-endpoint
description: Add a new API endpoint following the HivePulse build order
disable-model-invocation: true
---

Add a new API endpoint: $ARGUMENTS

Follow this exact build order — commit each step separately:

1. **Update API contract first**
   - Open `docs/api-contract.md`
   - Add the new endpoint with full request/response shapes and all field enums
   - Commit: `docs: add <endpoint-name> to api-contract.md`

2. **Backend (FastAPI)**
   - Implement the route in `backend/`
   - Add a migration if the schema changes (`backend/alembic/versions/`)
   - Write tests in `backend/tests/` — run `pytest` from `backend/` and confirm passing
   - Commit: `feat(backend): implement <endpoint-name>`

3. **Web (Next.js)**
   - Add typed fetch function to `lib/api.ts`
   - Implement the consuming page or component in `app/`
   - Write tests in `__tests__/` — run `npm test` and confirm passing
   - Commit: `feat(web): consume <endpoint-name>`

4. **iOS (Swift)**
   - Add model + API call in `ios/`
   - Add unit test for the new ViewModel method
   - Commit: `feat(ios): consume <endpoint-name>`

5. **Android (Kotlin)**
   - Add DTO + Repository + ViewModel changes in `android/`
   - Add unit test for the Repository and ViewModel
   - Commit: `feat(android): consume <endpoint-name>`

6. Push branch and open PR immediately.
