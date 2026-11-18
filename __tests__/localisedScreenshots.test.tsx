import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Help pages in five languages, showing German text beside an English dashboard (#475).
 *
 * The fix is deliberately one that can ship before a single localised picture exists: a page asks
 * for its own language's file, and when that is not there it shows the English one, which is
 * exactly what every page shows today. So the interesting tests here are not "the German picture
 * appears" — they are the two about *not* breaking:
 *
 *   * English must keep asking for the unsuffixed name, or 78 working pictures would 404 at once,
 *   * a language that has not been captured yet must fall back silently, not show a broken image.
 */
let mockLocale = 'en';
vi.mock('next-intl', () => ({ useLocale: () => mockLocale }));

import { localisedScreenshot } from '@/lib/screenshotLocale';
import HelpScreenshot from '@/components/HelpScreenshot';
import HelpScreenshotTabs from '@/components/HelpScreenshotTabs';

beforeEach(() => {
  mockLocale = 'en';
});

describe('localisedScreenshot', () => {
  it('leaves English alone, because that is what the 78 existing files are called', () => {
    expect(localisedScreenshot('/docs/screenshots/register-form.png', 'en'))
      .toBe('/docs/screenshots/register-form.png');
  });

  it.each([
    ['de', '/docs/screenshots/register-form-de.png'],
    ['fr', '/docs/screenshots/register-form-fr.png'],
    ['es', '/docs/screenshots/register-form-es.png'],
    ['pl', '/docs/screenshots/register-form-pl.png'],
  ])('puts the language before the extension for %s', (locale, expected) => {
    expect(localisedScreenshot('/docs/screenshots/register-form.png', locale)).toBe(expected);
  });

  it('keeps the extension it was given', () => {
    expect(localisedScreenshot('/year/winter-feeding.webp', 'de')).toBe('/year/winter-feeding-de.webp');
  });

  it('does not touch something that is not an image path', () => {
    expect(localisedScreenshot('/docs/screenshots/register-form', 'de'))
      .toBe('/docs/screenshots/register-form');
    expect(localisedScreenshot('', 'de')).toBe('');
  });
});

describe('a help page in another language', () => {
  it('asks for its own picture first', () => {
    mockLocale = 'de';
    const { container } = render(<HelpScreenshot caption="Registrierung" src="/docs/screenshots/register-form.png" />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/docs/screenshots/register-form-de.png');
  });

  it('shows the English picture when its own has not been captured yet', () => {
    mockLocale = 'pl';
    const { container } = render(<HelpScreenshot caption="Rejestracja" src="/docs/screenshots/register-form.png" />);

    fireEvent.error(container.querySelector('img')!);

    expect(container.querySelector('img')).toHaveAttribute('src', '/docs/screenshots/register-form.png');
  });

  it('gives up only when the English one is missing too', () => {
    mockLocale = 'fr';
    const { container } = render(<HelpScreenshot caption="Inscription" src="/docs/screenshots/never-taken.png" />);

    fireEvent.error(container.querySelector('img')!);   // no French picture
    fireEvent.error(container.querySelector('img')!);   // and no English one either

    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByText('Inscription')).toBeNull();
  });

  it('does not ask twice in English, so a genuinely missing picture still disappears', () => {
    const { container } = render(<HelpScreenshot caption="Register" src="/docs/screenshots/never-taken.png" />);

    fireEvent.error(container.querySelector('img')!);

    expect(container.querySelector('img')).toBeNull();
  });
});

describe('the platform tabs', () => {
  it('ask for each platform in the page language', () => {
    mockLocale = 'de';
    const { container } = render(
      <HelpScreenshotTabs android="/docs/screenshots/android-hive-list.png"
                          web="/docs/screenshots/hive-list.png" caption="Volkliste" />,
    );

    const sources = [...container.querySelectorAll('img')].map(i => i.getAttribute('src'));

    // The hidden probe for the iPhone picture is localised too.
    expect(sources).toContain('/docs/screenshots/ios-hive-list-de.png');
    expect(sources).toContain('/docs/screenshots/android-hive-list-de.png');
  });

  it('falls back per platform, not all at once', () => {
    mockLocale = 'es';
    const { container } = render(
      <HelpScreenshotTabs android="/docs/screenshots/android-hive-list.png"
                          web="/docs/screenshots/hive-list.png" caption="Lista" />,
    );

    const visible = () => [...container.querySelectorAll('img')].find(i => !i.hasAttribute('hidden'))!;
    expect(visible()).toHaveAttribute('src', '/docs/screenshots/android-hive-list-es.png');

    fireEvent.error(visible());

    // Android steps down to English; the iPhone probe is untouched by that.
    expect(visible()).toHaveAttribute('src', '/docs/screenshots/android-hive-list.png');
    const hidden = [...container.querySelectorAll('img')].find(i => i.hasAttribute('hidden'));
    expect(hidden).toHaveAttribute('src', '/docs/screenshots/ios-hive-list-es.png');
  });

  it('drops a tab only when the English picture is missing as well', () => {
    mockLocale = 'de';
    const { container } = render(
      <HelpScreenshotTabs android="/docs/screenshots/android-hive-list.png"
                          web="/docs/screenshots/hive-list.png" caption="Volkliste" />,
    );

    const visible = () => [...container.querySelectorAll('img')].find(i => !i.hasAttribute('hidden'));
    fireEvent.error(visible()!);   // no German Android picture
    fireEvent.error(visible()!);   // and no English one

    // The web tab is still offered: one platform missing is not all of them.
    expect(visible()).toHaveAttribute('src', '/docs/screenshots/hive-list-de.png');
  });
});
