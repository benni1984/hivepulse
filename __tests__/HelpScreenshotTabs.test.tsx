import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';

import HelpScreenshotTabs from '@/components/HelpScreenshotTabs';

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
