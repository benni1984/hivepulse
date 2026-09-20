import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import HelpTopicPage from '@/app/[locale]/help/[slug]/page';

const LOCALES = ['en', 'de', 'fr', 'es'] as const;

async function renderTopic(locale: string, slug: string) {
  const jsx = await HelpTopicPage({ params: Promise.resolve({ locale, slug }) });
  return render(jsx);
}

// The apps gained apiary and hive editing (and the public-map switch), which the help
// pages did not mention — a user whose community figures stayed at zero had nowhere to look.
describe('help covers editing and public visibility', () => {
  const editHints: Record<string, { apiary: RegExp; hive: RegExp; publicSwitch: RegExp }> = {
    en: { apiary: /Editing an apiary/i, hive: /Editing a hive/i, publicSwitch: /Show on public map/i },
    de: { apiary: /Bienenstand bearbeiten/i, hive: /Volk bearbeiten/i, publicSwitch: /Auf öffentlicher Karte anzeigen/i },
    fr: { apiary: /Modifier un rucher/i, hive: /Modifier une ruche/i, publicSwitch: /Afficher sur la carte publique/i },
    es: { apiary: /Editar un colmenar/i, hive: /Editar una colmena/i, publicSwitch: /Mostrar en el mapa público/i },
  };

  it.each(LOCALES)('explains how to edit an apiary and make it public (%s)', async locale => {
    const { container } = await renderTopic(locale, 'apiaries');
    const text = container.textContent ?? '';
    expect(text).toMatch(editHints[locale].apiary);
    expect(text).toMatch(editHints[locale].publicSwitch);
  });

  it.each(LOCALES)('explains how to edit a hive (%s)', async locale => {
    const { container } = await renderTopic(locale, 'hives');
    expect(container.textContent ?? '').toMatch(editHints[locale].hive);
  });

  it.each(LOCALES)('says frame counts are picked by tapping the number (%s)', async locale => {
    const { container } = await renderTopic(locale, 'inspections');
    const text = container.textContent ?? '';
    const hint: Record<string, RegExp> = {
      en: /tapping the number/i,
      de: /tippst du die Zahl/i,
      fr: /touchez directement le chiffre/i,
      es: /tocándolo directamente/i,
    };
    expect(text).toMatch(hint[locale]);
    expect(text).toMatch(/0 (bis|to|al)? ?10|0 à 10/i);
  });

  it('mentions that private apiaries are not counted, in every locale', async () => {
    const zeroHint: Record<string, RegExp> = {
      en: /private apiaries are never counted/i,
      de: /Private Bienenstände zählen nie mit/i,
      fr: /les ruchers privés ne sont jamais comptés/i,
      es: /los colmenares privados nunca se cuentan/i,
    };
    for (const locale of LOCALES) {
      const { container } = await renderTopic(locale, 'apiaries');
      expect(container.textContent ?? '', locale).toMatch(zeroHint[locale]);
    }
  });
});

// Email reminders (shipped in July) and the guided tour were never documented either.
describe('help covers reminder channels and the guided tour', () => {
  const emailHint: Record<string, RegExp> = {
    en: /email/i,
    de: /E-Mail/i,
    fr: /e-mail/i,
    es: /correo electrónico/i,
  };
  const tourHint: Record<string, RegExp> = {
    en: /guided tour/i,
    de: /geführte Tour|Tour erneut anzeigen/i,
    fr: /visite guidée/i,
    es: /recorrido guiado/i,
  };

  it.each(LOCALES)('names push and email as the two reminder channels (%s)', async locale => {
    const { container } = await renderTopic(locale, 'reminders');
    const text = container.textContent ?? '';
    expect(text).toMatch(emailHint[locale]);
    expect(text).toMatch(/push/i);
  });

  it.each(LOCALES)('mentions the guided tour in getting started (%s)', async locale => {
    const { container } = await renderTopic(locale, 'getting-started');
    expect(container.textContent ?? '').toMatch(tourHint[locale]);
  });
});
