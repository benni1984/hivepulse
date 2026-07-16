import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import FeatureForm from '@/components/FeatureForm';

describe('FeatureForm', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders the required fields', () => {
    render(<FeatureForm />);
    expect(screen.getByLabelText('label.title')).toBeTruthy();
    expect(screen.getByLabelText('label.desc')).toBeTruthy();
    expect(screen.getByLabelText('label.usecase')).toBeTruthy();
  });

  it('alerts and does not open GitHub when title and description are empty', () => {
    render(<FeatureForm />);
    fireEvent.click(screen.getByText('btn'));
    expect(window.alert).toHaveBeenCalledWith('Please fill in the title and description.');
    expect(window.open).not.toHaveBeenCalled();
  });

  it('opens a prefilled GitHub issue URL on valid submit', () => {
    render(<FeatureForm />);
    fireEvent.change(screen.getByLabelText('label.title'), { target: { value: 'Dark mode' } });
    fireEvent.change(screen.getByLabelText('label.desc'), { target: { value: 'Add a dark theme.' } });
    fireEvent.click(screen.getByText('btn'));

    expect(window.open).toHaveBeenCalledTimes(1);
    const [urlArg, target, features] = vi.mocked(window.open).mock.calls[0];
    expect(target).toBe('_blank');
    expect(features).toBe('noopener,noreferrer');

    const url = new URL(String(urlArg));
    expect(url.origin + url.pathname).toBe('https://github.com/benni1984/HivePulse/issues/new');
    expect(url.searchParams.get('title')).toBe('Dark mode');
    expect(url.searchParams.get('labels')).toBe('enhancement');
    expect(url.searchParams.get('body')).toContain('Add a dark theme.');
  });

  it('includes the platform line in the issue body when a platform is selected', () => {
    render(<FeatureForm />);
    fireEvent.change(screen.getByLabelText('label.title'), { target: { value: 'iOS widget' } });
    fireEvent.change(screen.getByLabelText('label.desc'), { target: { value: 'Add a home screen widget.' } });
    fireEvent.change(screen.getByLabelText('label.platform'), { target: { value: 'iOS' } });
    fireEvent.click(screen.getByText('btn'));

    const [urlArg] = vi.mocked(window.open).mock.calls[0];
    const body = new URL(String(urlArg)).searchParams.get('body')!;
    expect(body).toContain('**Platform:** iOS');
  });

  it('includes the use-case section only when filled in', () => {
    render(<FeatureForm />);
    fireEvent.change(screen.getByLabelText('label.title'), { target: { value: 'Export to CSV' } });
    fireEvent.change(screen.getByLabelText('label.desc'), { target: { value: 'Export inspections.' } });
    fireEvent.change(screen.getByLabelText('label.usecase'), { target: { value: 'For my spreadsheet workflow.' } });
    fireEvent.click(screen.getByText('btn'));

    const [urlArg] = vi.mocked(window.open).mock.calls[0];
    const body = new URL(String(urlArg)).searchParams.get('body')!;
    expect(body).toContain('For my spreadsheet workflow.');
  });

  it('sends the bug category as the label when selected', () => {
    render(<FeatureForm />);
    fireEvent.change(screen.getByLabelText('label.title'), { target: { value: 'Crash on save' } });
    fireEvent.change(screen.getByLabelText('label.desc'), { target: { value: 'App crashes when saving.' } });
    fireEvent.change(screen.getByLabelText('label.cat'), { target: { value: 'bug' } });
    fireEvent.click(screen.getByText('btn'));

    const [urlArg] = vi.mocked(window.open).mock.calls[0];
    expect(new URL(String(urlArg)).searchParams.get('labels')).toBe('bug');
  });
});
