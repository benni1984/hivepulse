import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

const links = vi.hoisted(() => ({
  current: { android: '', ios: '', email: 'hivepulse@multihead.de' },
}));
vi.mock('@/lib/beta', async () => {
  const actual = await vi.importActual<typeof import('@/lib/beta')>('@/lib/beta');
  return {
    ...actual,
    get BETA() { return links.current; },
    hasAnyBetaLink: (l?: Parameters<typeof actual.hasAnyBetaLink>[0]) =>
      actual.hasAnyBetaLink(l ?? links.current),
  };
});

import BetaPage from '@/app/[locale]/beta/page';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';

const render_ = async () =>
  render(await BetaPage({ params: Promise.resolve({ locale: 'de' }) }));

describe('BetaPage', () => {
  beforeEach(() => {
    links.current = { android: '', ios: '', email: 'hivepulse@multihead.de' };
  });

  it('says the test is not open yet instead of offering a dead button', async () => {
    const { container } = await render_();

    expect(screen.getByText('notOpenYet')).toBeTruthy();
    expect(container.querySelector('.beta-actions')).toBeNull();
  });

  it('offers each platform only once its link exists', async () => {
    links.current = { ...links.current, android: 'https://play.google.com/apps/testing/x' };

    const { container } = await render_();

    const buttons = container.querySelectorAll('.beta-actions a');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].getAttribute('href')).toContain('play.google.com');
    expect(screen.queryByText('notOpenYet')).toBeNull();
  });

  it('offers both when both exist', async () => {
    links.current = {
      android: 'https://play.google.com/apps/testing/x',
      ios: 'https://testflight.apple.com/join/y',
      email: 'hivepulse@multihead.de',
    };

    const { container } = await render_();

    expect(container.querySelectorAll('.beta-actions a')).toHaveLength(2);
  });

  it('gives a route for feedback that needs no account', async () => {
    const { container } = await render_();

    const mail = container.querySelector('a[href^="mailto:"]');
    expect(mail?.getAttribute('href')).toContain('hivepulse@multihead.de');
    // A prefilled subject so a reply lands in the right place.
    expect(mail?.getAttribute('href')).toContain('subject=');
  });

  it('lists what a tester is being asked for', async () => {
    const { container } = await render_();

    expect(container.querySelectorAll('ul.legal-list li')).toHaveLength(4);
  });
});

describe('the beta texts', () => {
  const locales = { en, de, fr, es } as Record<string, { beta: Record<string, string> }>;
  const required = [
    'title', 'intro', 'joinTitle', 'joinAndroid', 'joinIos', 'notOpenYet', 'joinNote',
    'expectTitle', 'expect1', 'expect2', 'expect3', 'expect4',
    'feedbackTitle', 'feedbackBody', 'feedbackSubject', 'feedbackHint',
    'dataTitle', 'dataBody',
  ];

  it('exist in all four languages', () => {
    for (const [name, messages] of Object.entries(locales)) {
      for (const key of required) {
        expect(messages.beta?.[key], `${name} is missing ${key}`).toBeTruthy();
      }
    }
  });

  it('name the fourteen days, because leaving early resets them for everyone', () => {
    expect(en.beta.expect3).toMatch(/two weeks|14|fourteen/i);
    expect(de.beta.expect3).toMatch(/zwei wochen|14/i);
    expect(fr.beta.expect3).toMatch(/deux semaines|14/i);
    expect(es.beta.expect3).toMatch(/dos semanas|14/i);
  });

  describe('the Android invitation note', () => {
    it('tells Android visitors they must be added first, once there is an Android link', async () => {
      links.current = { ...links.current, android: 'https://play.google.com/apps/testing/x' };

      const { container } = await render_();

      // Google lets only listed accounts into a closed test; anybody else opens the link and
      // meets "App not available". The page has to say so rather than let people find out.
      const note = container.querySelector('[data-testid="android-invitation-note"]');
      expect(note).not.toBeNull();
      expect(note!.querySelector('a[href^="mailto:"]')?.getAttribute('href'))
        .toContain('hivepulse@multihead.de');
    });

    it('is absent when there is no Android link', async () => {
      // Stated outright: this block sits next to others that leave their links behind.
      links.current = { android: '', ios: 'https://testflight.apple.com/join/y', email: 'hivepulse@multihead.de' };

      const { container } = await render_();

      expect(container.querySelector('[data-testid="android-invitation-note"]')).toBeNull();
    });

    it('does not apply to iPhone, whose link is open to anyone', async () => {
      links.current = { android: '', ios: 'https://testflight.apple.com/join/y', email: 'hivepulse@multihead.de' };

      const { container } = await render_();

      expect(container.querySelector('[data-testid="android-invitation-note"]')).toBeNull();
      expect(container.querySelectorAll('.beta-actions a')).toHaveLength(1);
    });

    it('exists in every language', () => {
      for (const messages of [en, de, fr, es]) {
        const beta = (messages as { beta: Record<string, string> }).beta;
        expect(beta.androidNote).toBeTruthy();
        expect(beta.androidNoteSubject).toBeTruthy();
      }
    });
  });

});
