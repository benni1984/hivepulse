import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';

import HelpScreenshotTabs, { iosCounterpart } from '@/components/HelpScreenshotTabs';

describe('HelpScreenshotTabs', () => {
  it('shows the android screenshot by default with the App tab active', () => {
    const { container } = render(
      <HelpScreenshotTabs android="/android.png" web="/web.png" caption="A caption" />,
    );
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('src', '/android.png');
    expect(screen.getByRole('tab', { name: /App/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Web/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('switches to the web screenshot when the Web tab is clicked', () => {
    const { container } = render(
      <HelpScreenshotTabs android="/android.png" web="/web.png" caption="A caption" />,
    );
    fireEvent.click(screen.getByRole('tab', { name: /Web/ }));
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('src', '/web.png');
    expect(screen.getByRole('tab', { name: /Web/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('opens and closes the lightbox', () => {
    const { container } = render(
      <HelpScreenshotTabs android="/android.png" web="/web.png" caption="A caption" />,
    );
    expect(container.querySelector('.help-lightbox')).toBeNull();

    fireEvent.click(container.querySelector('img')!);
    expect(container.querySelector('.help-lightbox')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Close'));
    expect(container.querySelector('.help-lightbox')).toBeNull();
  });

  it('renders the caption', () => {
    render(<HelpScreenshotTabs android="/android.png" web="/web.png" caption="A caption" />);
    expect(screen.getAllByText('A caption').length).toBeGreaterThan(0);
  });
});

describe('HelpScreenshotTabs and the iPhone pictures', () => {
  const ANDROID = '/docs/screenshots/android-hive-list.png';
  const IOS = '/docs/screenshots/ios-hive-list.png';
  const preload = (container: HTMLElement) => container.querySelector('img[hidden]') as HTMLImageElement;

  it('finds the iPhone picture by name', () => {
    expect(iosCounterpart(ANDROID)).toBe(IOS);
    expect(iosCounterpart('/android.png')).toBeNull();
    expect(iosCounterpart('/docs/screenshots/hive-detail-web.png')).toBeNull();
  });

  it('offers no iPhone tab until its picture has loaded', () => {
    const { container } = render(<HelpScreenshotTabs android={ANDROID} web="/web.png" caption="c" />);

    expect(preload(container)).toHaveAttribute('src', IOS);
    expect(screen.queryByRole('tab', { name: /iPhone/ })).toBeNull();
    // with no iPhone tab the first one keeps its plain name
    expect(screen.getByRole('tab', { name: /App/ })).toBeInTheDocument();
  });

  it('adds an iPhone tab once the picture is there, and shows it', () => {
    const { container } = render(<HelpScreenshotTabs android={ANDROID} web="/web.png" caption="c" />);

    fireEvent.load(preload(container));
    fireEvent.click(screen.getByRole('tab', { name: /iPhone/ }));

    expect(container.querySelector('img:not([hidden])')).toHaveAttribute('src', IOS);
    expect(screen.getByRole('tab', { name: /Android/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Web/ })).toBeInTheDocument();
  });

  it('does without the iPhone tab when its picture is missing', () => {
    const { container } = render(<HelpScreenshotTabs android={ANDROID} web="/web.png" caption="c" />);

    fireEvent.error(preload(container));

    expect(screen.queryByRole('tab', { name: /iPhone/ })).toBeNull();
  });

  it('leaves out a platform whose picture has not been produced yet', () => {
    const { container } = render(<HelpScreenshotTabs android={ANDROID} web="/web.png" caption="c" />);

    fireEvent.error(container.querySelector('img:not([hidden])')!);

    expect(screen.queryByRole('tab', { name: /App/ })).toBeNull();
    expect(container.querySelector('img:not([hidden])')).toHaveAttribute('src', '/web.png');
  });

  it('shows nothing when no picture exists at all', () => {
    const { container } = render(<HelpScreenshotTabs android={ANDROID} web="/web.png" caption="c" />);

    fireEvent.error(container.querySelector('img:not([hidden])')!);
    fireEvent.error(container.querySelector('img:not([hidden])')!);

    expect(container.querySelector('figure')).toBeNull();
  });
});
