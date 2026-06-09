---
name: fix-issue
description: Analyze and fix a GitHub issue in HivePulse
disable-model-invocation: true
---

Analyze and fix GitHub issue: $ARGUMENTS

1. Use `gh issue view $ARGUMENTS` to read the full issue
2. Identify which component(s) are affected (backend / web / ios / android)
3. Read the relevant source files — use plan mode to explore without making changes
4. Write a failing test that reproduces the issue
5. Fix the root cause (not just the symptom)
6. Run the relevant test suite and confirm it passes:
   - Backend: `pytest` from `backend/`
   - Web: `npm test` from repo root
   - Android: `./gradlew test` from `android/`
7. Commit with message referencing the issue: `fix: <description> (closes #$ARGUMENTS)`
8. Push and open a PR
