/**
 * Tests for the Hornets report page, focusing on the trap selector feature
 * added in #135 and the existing catch/nest submission flows.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockSubmitHornetCatch = vi.hoisted(() => vi.fn());
const mockSubmitHornetNest = vi.hoisted(() => vi.fn());
const mockAddTrapCatch = vi.hoisted(() => vi.fn());
const mockGetMyTraps = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  submitHornetCatch: mockSubmitHornetCatch,
  submitHornetNest: mockSubmitHornetNest,
  addTrapCatch: mockAddTrapCatch,
  getMyTraps: mockGetMyTraps,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'report.title': 'Report',
      'report.catchTab': 'Report a Catch',
      'report.nestTab': 'Report a Nest',
      'report.count': 'Number caught',
      'report.latitude': 'Latitude',
      'report.longitude': 'Longitude',
      'report.name': 'Your name (optional)',
      'report.namePlaceholder': 'Anonymous',
      'report.notes': 'Notes (optional)',
      'report.photo': 'Photo (optional)',
      'report.uploading': 'Uploading…',
      'report.photoReady': 'Photo uploaded',
      'report.uploadError': 'Photo upload failed. Please try again.',
      'report.locationRequired': 'Latitude and longitude are required for nest reports.',
      'report.submitError': 'Submission failed. Please try again.',
      'report.submit': 'Submit',
      'report.success': 'Thank you! Your report has been submitted.',
      'report.countError': 'Count must be between 1 and 1000',
      'report.trap': 'Log to my trap (optional)',
      'report.trapNone': '— No trap (anonymous report) —',
    };
    return map[key] ?? key;
  },
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import HornetReportPage from '@/app/[locale]/hornets/report/page';

const mockTrap = {
  id: 't1',
  access_code: 'TRAP0001',
  name: 'Garden Trap',
  latitude: 48.85,
  longitude: 2.35,
  notes: null,
  owner_name: null,
  created_at: '2026-05-01T10:00:00',
  total_caught: 7,
  catches: [],
};

describe('HornetReportPage', () => {
  beforeEach(() => {
    mockSubmitHornetCatch.mockReset();
    mockSubmitHornetNest.mockReset();
    mockAddTrapCatch.mockReset();
    mockGetMyTraps.mockReset();
    mockGetMyTraps.mockResolvedValue([]);
  });

  // ── Basic rendering ────────────────────────────────────────────────────────

  it('renders both tabs', () => {
    render(<HornetReportPage />);
    expect(screen.getByText('Report a Catch')).toBeTruthy();
    expect(screen.getByText('Report a Nest')).toBeTruthy();
  });

  it('shows catch form by default', () => {
    render(<HornetReportPage />);
    expect(screen.getByText('Number caught')).toBeTruthy();
  });

  it('switches to nest form when nest tab is clicked', async () => {
    render(<HornetReportPage />);
    fireEvent.click(screen.getByText('Report a Nest'));
    await waitFor(() => expect(screen.getByText('Notes (optional)')).toBeTruthy());
  });

  // ── Anonymous catch submission ────────────────────────────────────────────

  it('submits anonymous catch without trap when no traps available', async () => {
    mockGetMyTraps.mockResolvedValue([]);
    mockSubmitHornetCatch.mockResolvedValue(undefined);
    render(<HornetReportPage />);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(mockSubmitHornetCatch).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 })
    ));
    expect(mockAddTrapCatch).not.toHaveBeenCalled();
  });

  it('shows success message after anonymous catch submission', async () => {
    mockSubmitHornetCatch.mockResolvedValue(undefined);
    render(<HornetReportPage />);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() =>
      expect(screen.getByText('Thank you! Your report has been submitted.')).toBeTruthy()
    );
  });

  it('shows error banner when anonymous catch submission fails', async () => {
    mockSubmitHornetCatch.mockRejectedValue(new Error('network'));
    render(<HornetReportPage />);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() =>
      expect(screen.getByText('Submission failed. Please try again.')).toBeTruthy()
    );
  });

  // ── Trap selector ─────────────────────────────────────────────────────────

  it('does not show trap selector when user has no traps', async () => {
    mockGetMyTraps.mockResolvedValue([]);
    render(<HornetReportPage />);
    await waitFor(() => expect(mockGetMyTraps).toHaveBeenCalled());
    expect(screen.queryByText('Log to my trap (optional)')).toBeNull();
  });

  it('shows trap selector when user has registered traps', async () => {
    mockGetMyTraps.mockResolvedValue([mockTrap]);
    render(<HornetReportPage />);
    await waitFor(() => expect(screen.getByText('Log to my trap (optional)')).toBeTruthy());
    expect(screen.getByText('— No trap (anonymous report) —')).toBeTruthy();
    expect(screen.getByText('Garden Trap (TRAP0001)')).toBeTruthy();
  });

  it('calls addTrapCatch (not submitHornetCatch) when a trap is selected', async () => {
    mockGetMyTraps.mockResolvedValue([mockTrap]);
    mockAddTrapCatch.mockResolvedValue({ id: 'c1', trap_id: 't1', count: 3, caught_on: '2026-05-25' });
    render(<HornetReportPage />);
    await waitFor(() => expect(screen.getByText('Log to my trap (optional)')).toBeTruthy());

    // Select the trap
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'TRAP0001' } });

    // Change count to 3
    const countInput = screen.getByDisplayValue('1');
    fireEvent.change(countInput, { target: { value: '3' } });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() =>
      expect(mockAddTrapCatch).toHaveBeenCalledWith('TRAP0001', expect.objectContaining({ count: 3 }))
    );
    expect(mockSubmitHornetCatch).not.toHaveBeenCalled();
  });

  it('shows success after logging to a trap', async () => {
    mockGetMyTraps.mockResolvedValue([mockTrap]);
    mockAddTrapCatch.mockResolvedValue({ id: 'c1', trap_id: 't1', count: 1, caught_on: '2026-05-25' });
    render(<HornetReportPage />);
    await waitFor(() => expect(screen.getByText('Log to my trap (optional)')).toBeTruthy());

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TRAP0001' } });
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() =>
      expect(screen.getByText('Thank you! Your report has been submitted.')).toBeTruthy()
    );
  });

  it('falls back to anonymous submit when no trap is selected (default option)', async () => {
    mockGetMyTraps.mockResolvedValue([mockTrap]);
    mockSubmitHornetCatch.mockResolvedValue(undefined);
    render(<HornetReportPage />);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeTruthy());

    // Leave trap selection at default (empty = no trap)
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(mockSubmitHornetCatch).toHaveBeenCalled());
    expect(mockAddTrapCatch).not.toHaveBeenCalled();
  });
});
