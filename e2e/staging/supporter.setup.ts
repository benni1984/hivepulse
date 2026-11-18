import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { revealEmailForm } from './signin';

const AUTH_FILE = '.auth/supporter.json';

/**
 * A second account, and a paying one.
 *
 * Since the free line was drawn (#478) the demo account can no longer do everything this suite
 * used to do with it: custom fields and inviting belong to the subscription, and the account is
 * long past ten colonies because every run leaves its apiaries behind. Five specs went red on
 * main for exactly that — after the merge, which is the first moment this suite can speak, since
 * it only runs against staging once something is already deployed.
 *
 * The obvious fix was to make the demo account a supporter. That would have been wrong twice
 * over: `stats.spec.ts` and `members.spec.ts` assert that a **non**-supporter is turned away
 * from the community dashboard, and they do it with this very account. Promoting it would have
 * traded five failures for two and quietly deleted the only end-to-end coverage of the free
 * tier — which is the tier most people will actually be on.
 *
 * So the demo account stays free, and the specs that need a subscription get their own account
 * here. It is promoted through `PUT /admin/users/{id}/supporter`, the same path a courtesy grant
 * takes in real life, rather than through a seed or a poke at the database — which also means
 * this setup exercises that endpoint writing a record and not merely a flag.
 */
setup('authenticate as a supporter', async ({ page, request }) => {
  const demo = process.env.STAGING_DEMO_EMAIL ?? 'demo@HivePulse.dev';
  const password = process.env.STAGING_DEMO_PASSWORD ?? 'Demo1234!';
  // A sibling address of the demo account, so it is recognisable in the user list and shares
  // whatever mail domain staging is happy with.
  const email = demo.replace('@', '+supporter@');

  await request.post('/api/v1/auth/register', {
    data: { email, password, name: 'Demo Supporter' },
    failOnStatusCode: false,
  });

  const adminEmail = process.env.STAGING_ADMIN_EMAIL;
  const adminPassword = process.env.STAGING_ADMIN_PASSWORD?.trim();
  expect(adminEmail, 'STAGING_ADMIN_EMAIL is needed to grant the subscription').toBeTruthy();
  expect(adminPassword, 'STAGING_ADMIN_PASSWORD is needed to grant the subscription').toBeTruthy();

  const login = await request.post('/api/v1/auth/login', {
    data: { email: adminEmail, password: adminPassword },
  });
  expect(login.ok(), 'the admin account must be able to sign in').toBeTruthy();
  const { access_token: token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };

  // `q` searches by e-mail, and `per_page` is capped at 100 by the endpoint — asking for more
  // answers 422, and a silently skipped promotion would look exactly like the free limit.
  const users = await request.get(
    `/api/v1/admin/users?q=${encodeURIComponent(email)}&per_page=100`,
    { headers },
  );
  expect(users.ok(), 'the admin user list must be readable').toBeTruthy();
  const list: { id: string; email: string; is_supporter: boolean }[] =
    (await users.json()).items ?? [];
  const account = list.find((u) => u.email.toLowerCase() === email.toLowerCase());
  expect(account, `the supporter account ${email} should exist after registering`).toBeTruthy();

  if (!account!.is_supporter) {
    const granted = await request.put(`/api/v1/admin/users/${account!.id}/supporter`, {
      data: { is_supporter: true },
      headers,
    });
    expect(granted.ok(), 'granting the subscription must succeed').toBeTruthy();
  }

  // One apiary with one hive, always. Two tests in hive.spec navigate by clicking the *first*
  // apiary card and then the first hive card -- on a brand-new account there are none, and they
  // would time out looking for something that was never there. Both tolerate an empty history
  // ("No mood data yet", a load-more button that is simply absent); what they cannot tolerate is
  // an empty dashboard.
  const asSupporter = await request.post('/api/v1/auth/login', { data: { email, password } });
  expect(asSupporter.ok(), 'the supporter account must be able to sign in').toBeTruthy();
  const supporterHeaders = {
    Authorization: `Bearer ${(await asSupporter.json()).access_token}`,
  };

  const apiaries = await request.get('/api/v1/apiaries', { headers: supporterHeaders });
  let apiaryId = ((await apiaries.json()).items ?? [])[0]?.id;
  if (!apiaryId) {
    const made = await request.post('/api/v1/apiaries', {
      data: { name: 'E2E Home', address: 'Freiburg' },
      headers: supporterHeaders,
    });
    expect(made.ok(), 'creating the fixture apiary must succeed').toBeTruthy();
    apiaryId = (await made.json()).id;
  }

  const hives = await request.get(`/api/v1/apiaries/${apiaryId}/hives`, { headers: supporterHeaders });
  let hiveId = ((await hives.json()).items ?? [])[0]?.id;
  if (!hiveId) {
    const made = await request.post(`/api/v1/apiaries/${apiaryId}/hives`, {
      data: { name: 'E2E Hive', hive_type: 'langstroth' },
      headers: supporterHeaders,
    });
    expect(made.ok(), 'creating the fixture hive must succeed').toBeTruthy();
    hiveId = (await made.json()).id;
  }

  // And one inspection, so the hive has an inspection *table* at all.
  //
  // The first version of this fixture stopped at the hive, on the reasoning that the two
  // navigating tests tolerate an empty history. That was true of the mood test, which accepts
  // "No mood data yet" — and wrong about the load-more test, which asserts
  // `table.dash-inspection-table` unconditionally and only guards the button. With no
  // inspections there is no table, and it failed on main.
  //
  // One is enough: the table appears, the load-more button does not, and the test's own
  // `if (await loadMoreBtn.isVisible())` takes it from there.
  const inspections = await request.get(`/api/v1/hives/${hiveId}/inspections`, {
    headers: supporterHeaders,
  });
  if ((((await inspections.json()).items ?? []).length) === 0) {
    const made = await request.post(`/api/v1/hives/${hiveId}/inspections`, {
      data: {
        date: new Date().toISOString().slice(0, 10),
        mood: 'calm',
        notes: 'Fixture inspection for the staging E2E suite.',
      },
      headers: supporterHeaders,
    });
    expect(made.ok(), 'creating the fixture inspection must succeed').toBeTruthy();
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.goto('/dashboard/login');
  await revealEmailForm(page);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button.dash-submit-btn').click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
