import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';

const HIVE_TYPES = ['langstroth', 'dadant', 'top_bar', 'warre', 'other'] as const;

describe('hive type labels in the message files', () => {
  const locales = { en, de, fr, es } as Record<string, { hiveTypes: Record<string, string> }>;

  it('exist in every language', () => {
    for (const [name, messages] of Object.entries(locales)) {
      for (const type of HIVE_TYPES) {
        expect(messages.hiveTypes?.[type], `${name} is missing ${type}`).toBeTruthy();
      }
    }
  });

  it('are words, not the raw values the API stores', () => {
    // The bug this replaces: the form listed "top_bar" and "langstroth" verbatim.
    for (const [name, messages] of Object.entries(locales)) {
      expect(messages.hiveTypes.top_bar, `${name} still shows the raw value`).not.toBe('top_bar');
      expect(messages.hiveTypes.top_bar).not.toMatch(/_/);
      expect(messages.hiveTypes.other).not.toBe('other');
    }
  });

  it('translate the two descriptive ones and leave the three names alone', () => {
    // Langstroth, Dadant and Warré are the people who designed those hives.
    for (const messages of Object.values(locales)) {
      expect(messages.hiveTypes.langstroth).toBe('Langstroth');
      expect(messages.hiveTypes.dadant).toBe('Dadant');
      expect(messages.hiveTypes.warre).toBe('Warré');
    }
    expect(de.hiveTypes.top_bar).not.toBe(en.hiveTypes.top_bar);
    expect(de.hiveTypes.other).not.toBe(en.hiveTypes.other);
    expect(fr.hiveTypes.other).not.toBe(en.hiveTypes.other);
    expect(es.hiveTypes.other).not.toBe(en.hiveTypes.other);
  });
});

// The page tests elsewhere mock the translator as the identity function, which cannot tell a
// translated label from the raw value. This one marks what came through the translator.
const mockGetApiary = vi.hoisted(() => vi.fn());
const mockGetHives = vi.hoisted(() => vi.fn());
const mockGetApiaryStats = vi.hoisted(() => vi.fn());
const mockGetApiaryFieldDefs = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string) =>
    namespace === 'hiveTypes' ? `translated:${key}` : key,
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'apiary-1' }) }));

vi.mock('@/components/DashboardShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useDashboardAuth', () => ({ useDashboardReady: () => true }));

vi.mock('@/lib/api', () => ({
  getApiary: mockGetApiary,
  getHives: mockGetHives,
  getApiaryStats: mockGetApiaryStats,
  getApiaryFieldDefs: mockGetApiaryFieldDefs,
  createApiaryFieldDef: vi.fn(),
  updateApiaryFieldDef: vi.fn(),
  deleteApiaryFieldDef: vi.fn(),
  updateApiary: vi.fn(),
  deleteApiary: vi.fn(),
  createHive: vi.fn(),
  exportApiaryInspections: vi.fn(),
  logout: vi.fn(),
}));

import ApiaryPage from '@/app/[locale]/dashboard/apiary/[id]/page';

describe('the apiary page', () => {
  beforeEach(() => {
    mockGetApiary.mockResolvedValue({
      id: 'apiary-1', name: 'Wiese', latitude: 47, longitude: 7,
      is_public: false, hive_count: 1, created_at: '2026-01-01',
    });
    // getHives is paginated, like the API
    mockGetHives.mockResolvedValue({
      items: [{ id: 'hive-1', name: 'Volk 1', hive_type: 'top_bar', apiary_id: 'apiary-1', qr_token: 'abc', created_at: '2026-01-01' }],
      total: 1, page: 1, per_page: 100,
    });
    mockGetApiaryStats.mockResolvedValue({
      hive_count: 1, inspections_total: 0,
      mood_distribution: { calm: 0, nervous: 0, aggressive: 0 },
    });
    mockGetApiaryFieldDefs.mockResolvedValue([]);
  });

  it('shows a hive type through the translator, never the stored value', async () => {
    const { container } = render(<ApiaryPage />);

    await waitFor(() => expect(container.querySelector('.hive-type')).not.toBeNull());

    expect(container.querySelector('.hive-type')?.textContent).toBe('translated:top_bar');
    expect(container.textContent).not.toContain('>top_bar<');
  });
});
