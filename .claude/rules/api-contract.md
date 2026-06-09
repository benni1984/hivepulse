---
paths:
  - "backend/**/*.py"
  - "lib/api.ts"
  - "docs/**"
---

# API Contract Rules

- `docs/api-contract.md` is the source of truth for all endpoints, request/response shapes, and enums.
- ALWAYS update `docs/api-contract.md` FIRST before implementing any new endpoint.
- All clients (web, iOS, Android) must stay in sync with this file.
- Field enums (queen color SICAMM cycle, etc.) are defined there — do not hardcode values elsewhere.
