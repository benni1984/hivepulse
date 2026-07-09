import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockCreateHornetTrap = vi.hoisted(() => vi.fn());
const mockGetHornetTrap = vi.hoisted(() => vi.fn());
const mockAddTrapCatch = vi.hoisted(() => vi.fn());
const mockGetNearbyTraps = vi.hoisted(() => vi.fn());
const mockGetCurrentPosition = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  createHornetTrap: mockCreateHornetTrap,
  getHornetTrap: mockGetHornetTrap,
  addTrapCatch: mockAddTrapCatch,
  getNearbyTraps: mockGetNearbyTraps,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import HornetTrapsPage from '@/app/[locale]/hornets/traps/page';

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
  catches: [{ id: 'c1', trap_id: 't1', count: 4, caught_on: '2026-05-20', created_at: '2026-05-20T10:00:00' }],
};

describe('HornetTrapsPage', () => {
  beforeEach(() => {
    mockCreateHornetTrap.mockReset();
    mockGetHornetTrap.mockReset();
    mockAddTrapCatch.mockReset();
    mockGetNearbyTraps.mockReset();
    mockGetCurrentPosition.mockReset();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
    });
    Object.defineProperty(global.navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it('renders the three home action cards', () => {
    render(<HornetTrapsPage />);
    expect(screen.getByText('traps.nearby')).toBeTruthy();
    expect(screen.getByText('traps.search')).toBeTruthy();
    expect(screen.getByText('traps.new')).toBeTruthy();
  });

  // ── Code search ──────────────────────────────────────────────────────────

  it('finds a trap by access code', async () => {
    mockGetHornetTrap.mockResolvedValue(mockTrap);
    render(<HornetTrapsPage />);
    fireEvent.click(screen.getByText('traps.search'));

    const input = screen.getByPlaceholderText('traps.searchCode');
    fireEvent.change(input, { target: { value: 'trap0001' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(screen.getByText('Garden Trap')).toBeTruthy());
    expect(mockGetHornetTrap).toHaveBeenCalledWith('TRAP0001');
  });

  it('shows an error when the trap code is not found', async () => {
    mockGetHornetTrap.mockRejectedValue(new Error('not found'));
    render(<HornetTrapsPage />);
    fireEvent.click(screen.getByText('traps.search'));
    const input = screen.getByPlaceholderText('traps.searchCode');
    fireEvent.change(input, { target: { value: 'BADCODE1' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(screen.getByText('traps.notFound')).toBeTruthy());
  });

  // ── Nearby search ────────────────────────────────────────────────────────

  it('lists nearby traps using geolocation', async () => {
    mockGetCurrentPosition.mockImplementation((success: PositionCallback) =>
      success({ coords: { latitude: 48.85, longitude: 2.35 } } as GeolocationPosition),
    );
    mockGetNearbyTraps.mockResolvedValue([
      { access_code: 'TRAP0001', name: 'Garden Trap', latitude: 48.85, longitude: 2.35, distance_m: 120, total_caught: 7 },
    ]);
    render(<HornetTrapsPage />);
    fireEvent.click(screen.getByText('traps.nearby'));

    await waitFor(() => expect(mockGetNearbyTraps).toHaveBeenCalledWith(48.85, 2.35, 50));
    expect(screen.getByText('Garden Trap')).toBeTruthy();
  });

  it('shows a GPS error when geolocation is denied', async () => {
    mockGetCurrentPosition.mockImplementation((_success: PositionCallback, error: PositionErrorCallback) =>
      error(new Error('denied') as unknown as GeolocationPositionError),
    );
    render(<HornetTrapsPage />);
    fireEvent.click(screen.getByText('traps.nearby'));

    await waitFor(() => expect(screen.getByText('traps.gpsError')).toBeTruthy());
  });

  // ── Register ─────────────────────────────────────────────────────────────

  it('registers a new trap and shows the access code', async () => {
    mockCreateHornetTrap.mockResolvedValue(mockTrap);
    render(<HornetTrapsPage />);
    fireEvent.click(screen.getByText('traps.new'));

    fireEvent.change(screen.getByPlaceholderText('traps.namePlaceholder'), { target: { value: 'Garden Trap' } });
    const numberInputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(numberInputs[0], { target: { value: '48.85' } });
    fireEvent.change(numberInputs[1], { target: { value: '2.35' } });
    fireEvent.click(screen.getByText('traps.submit'));

    await waitFor(() =>
      expect(mockCreateHornetTrap).toHaveBeenCalledWith({
        name: 'Garden Trap',
        latitude: 48.85,
        longitude: 2.35,
        notes: undefined,
        owner_name: undefined,
      }),
    );
    await waitFor(() => expect(screen.getByText('TRAP0001')).toBeTruthy());
  });

  it('shows an error when trap registration fails', async () => {
    mockCreateHornetTrap.mockRejectedValue(new Error('fail'));
    render(<HornetTrapsPage />);
    fireEvent.click(screen.getByText('traps.new'));
    fireEvent.change(screen.getByPlaceholderText('traps.namePlaceholder'), { target: { value: 'Garden Trap' } });
    const numberInputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(numberInputs[0], { target: { value: '48.85' } });
    fireEvent.change(numberInputs[1], { target: { value: '2.35' } });
    fireEvent.click(screen.getByText('traps.submit'));

    await waitFor(() => expect(screen.getByText('traps.logError')).toBeTruthy());
  });

  it('fills GPS coordinates in the register form', async () => {
    mockGetCurrentPosition.mockImplementation((success: PositionCallback) =>
      success({ coords: { latitude: 48.85, longitude: 2.35 } } as GeolocationPosition),
    );
    render(<HornetTrapsPage />);
    fireEvent.click(screen.getByText('traps.new'));
    fireEvent.click(screen.getByTitle('traps.gps'));

    await waitFor(() => expect(screen.getByDisplayValue('48.850000')).toBeTruthy());
    expect(screen.getByDisplayValue('2.350000')).toBeTruthy();
  });

  // ── Trap detail / log catch ─────────────────────────────────────────────

  it('logs a catch and refreshes the trap', async () => {
    mockGetHornetTrap.mockResolvedValue(mockTrap);
    mockAddTrapCatch.mockResolvedValue({ id: 'c2', trap_id: 't1', count: 2, caught_on: '2026-06-01', created_at: '2026-06-01T10:00:00' });
    render(<HornetTrapsPage />);
    fireEvent.click(screen.getByText('traps.search'));
    const input = screen.getByPlaceholderText('traps.searchCode');
    fireEvent.change(input, { target: { value: 'TRAP0001' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(screen.getByText('Garden Trap')).toBeTruthy());

    fireEvent.click(screen.getByText('traps.logSubmit'));

    await waitFor(() =>
      expect(mockAddTrapCatch).toHaveBeenCalledWith('TRAP0001', expect.objectContaining({ count: 1 })),
    );
    await waitFor(() => expect(screen.getByText('traps.logSuccess')).toBeTruthy());
    expect(mockGetHornetTrap).toHaveBeenCalledTimes(2);
  });

  it('copies the access code to the clipboard', async () => {
    mockGetHornetTrap.mockResolvedValue(mockTrap);
    render(<HornetTrapsPage />);
    fireEvent.click(screen.getByText('traps.search'));
    const input = screen.getByPlaceholderText('traps.searchCode');
    fireEvent.change(input, { target: { value: 'TRAP0001' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(screen.getByText('Garden Trap')).toBeTruthy());

    fireEvent.click(screen.getByTitle('traps.codeCopy'));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TRAP0001'));
  });
});
