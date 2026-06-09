---
name: seed-staging
description: Trigger a staging seed and verify the staging environment is healthy
disable-model-invocation: true
---

Seed and verify the HivePulse staging environment.

1. Trigger the seed via GitHub Actions:
   ```
   gh workflow run seed-staging.yml
   ```

2. Wait for the workflow to complete:
   ```
   gh run list --workflow=seed-staging.yml --limit=1
   gh run watch <run-id>
   ```

3. Verify staging is healthy by checking:
   - Login with `demo@apiscan.app` / `demo1234` returns a valid JWT
   - `GET https://apiscan-two.vercel.app/api/public/stats` returns 200

4. Report the result — if any step fails, show the workflow logs:
   ```
   gh run view <run-id> --log-failed
   ```
