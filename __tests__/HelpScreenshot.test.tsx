import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('@/components/HelpScreenshotTabs', () => ({
  default: (props: { android: string; web: string; caption: string }) => (
    <div data-testid="screenshot-tabs" data-android={props.android} data-web={props.web} data-caption={props.caption} />
  ),
}));

import HelpScreenshot from '@/components/HelpScreenshot';

describe('HelpScreenshot', () => {
  it('delegates to HelpScreenshotTabs when both android and web are given', () => {
    render(<HelpScreenshot caption="Shared shot" android="/a.png" web="/w.png" />);
    const tabs = screen.getByTestId('screenshot-tabs');
    expect(tabs).toHaveAttribute('data-android', '/a.png');
    expect(tabs).toHaveAttribute('data-web', '/w.png');
    expect(tabs).toHaveAttribute('data-caption', 'Shared shot');
  });

  it('shows a placeholder when no image source is given', () => {
    render(<HelpScreenshot caption="No image yet" />);
    expect(screen.getByText('Screenshot: No image yet')).toBeTruthy();
  });

  it('renders a thumbnail image with the caption when src is given', () => {
    const { container } = render(<HelpScreenshot caption="A single shot" src="/single.png" />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('src', '/single.png');
    expect(img).toHaveAttribute('alt', 'A single shot');
    expect(screen.getByText('A single shot')).toBeTruthy();
  });

  it('uses the alt prop over the caption when provided', () => {
    const { container } = render(<HelpScreenshot caption="Caption text" alt="Alt text" src="/single.png" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', 'Alt text');
  });

  it('opens a lightbox on click and closes it via the close button', () => {
    const { container } = render(<HelpScreenshot caption="A single shot" src="/single.png" />);
    expect(container.querySelector('.help-lightbox')).toBeNull();

    fireEvent.click(container.querySelector('.help-screenshot--thumb')!);
    expect(container.querySelector('.help-lightbox')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Close'));
    expect(container.querySelector('.help-lightbox')).toBeNull();
  });

  it('does not open a lightbox when there is no image', () => {
    const { container } = render(<HelpScreenshot caption="No image yet" />);
    fireEvent.click(container.querySelector('.help-screenshot--thumb')!);
    expect(container.querySelector('.help-lightbox')).toBeNull();
  });
});
