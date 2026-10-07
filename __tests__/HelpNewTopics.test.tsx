import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { HELP_TOPICS } from '@/lib/helpTopics';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import pl from '@/messages/pl.json';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import HelpTopicPage from '@/app/[locale]/help/[slug]/page';

const NEW_TOPICS = ['sharing', 'moving-hives', 'home-and-treatments', 'beekeeping-year'] as const;
const LOCALES = ['en', 'de', 'fr', 'es', 'pl'] as const;
const MESSAGES = { en, de, fr, es, pl } as const;

async function headings(locale: string, slug: string): Promise<string[]> {
  const jsx = await HelpTopicPage({ params: Promise.resolve({ locale, slug }) });
  const { container } = render(jsx);
  const out = [...container.querySelectorAll('.help-section-title')].map(h => h.textContent ?? '');
  container.remove();
  return out;
}

describe('help pages for working together, moving hives and the home screen', () => {
  it('are registered as help topics', () => {
    for (const slug of NEW_TOPICS) {
      expect(HELP_TOPICS.find(t => t.slug === slug), slug).toBeTruthy();
    }
  });

  it('have a title and a description in every language', () => {
    for (const locale of LOCALES) {
      const topics = MESSAGES[locale].helpIndex.topics as Record<string, { title: string; desc: string }>;
      for (const slug of NEW_TOPICS) {
        expect(topics[slug]?.title, `${locale}/${slug} title`).toBeTruthy();
        expect(topics[slug]?.desc, `${locale}/${slug} desc`).toBeTruthy();
      }
    }
  });

  it('have content in every language, translated rather than copied', async () => {
    for (const slug of NEW_TOPICS) {
      const byLocale: Record<string, string[]> = {};
      for (const locale of LOCALES) byLocale[locale] = await headings(locale, slug);

      for (const locale of LOCALES) {
        expect(byLocale[locale].length, `${locale}/${slug} has no sections`).toBeGreaterThan(1);
        expect(byLocale[locale].length).toBe(byLocale.en.length);
      }
      for (const locale of ['de', 'fr', 'es', 'pl']) {
        expect(byLocale[locale], `${locale}/${slug} is a copy of the English page`).not.toEqual(byLocale.en);
      }
    }
  });

  it('use the words of the apps in German', async () => {
    const text = (await Promise.all(NEW_TOPICS.map(async slug => {
      const jsx = await HelpTopicPage({ params: Promise.resolve({ locale: 'de', slug }) });
      const { container } = render(jsx);
      const content = container.textContent ?? '';
      container.remove();
      return content;
    }))).join(' ');

    expect(text).toMatch(/Bienenstand/);
    expect(text).toMatch(/Kontrolle/);
    expect(text).not.toMatch(/Begehung|Inspektion/);
  });
});
