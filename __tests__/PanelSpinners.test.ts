import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The staging E2E suite waits for `page.locator('.spinner')` to disappear and Playwright refuses a
// locator that matches two elements. The sharing and treatments panels sit on the apiary and hive
// pages next to the page's own spinner, and once used the same class: every E2E test of those pages
// failed on main, no production deploy followed, and the apps asked a server that lacked the routes.
describe('panels on the apiary and hive pages', () => {
  for (const file of ['components/SharingPanel.tsx', 'components/TreatmentsPanel.tsx']) {
    it(`${file} keeps the page spinner class to the page`, () => {
      const source = readFileSync(join(process.cwd(), file), 'utf-8');
      expect(source).not.toMatch(/className="spinner"/);
      expect(source).toMatch(/dash-panel-spinner/);
    });
  }

  it('styles the panel spinner like the page spinner', () => {
    const css = readFileSync(join(process.cwd(), 'web/style.css'), 'utf-8');
    expect(css).toMatch(/\.spinner,\s*\.dash-panel-spinner\s*\{/);
  });
});
