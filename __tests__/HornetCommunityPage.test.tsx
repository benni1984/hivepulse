import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockGetHornetSightings = vi.hoisted(() => vi.fn());
const mockSubmitHornetSighting = vi.hoisted(() => vi.fn());
const mockVoteOnSighting = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  getHornetSightings: mockGetHornetSightings,
  submitHornetSighting: mockSubmitHornetSighting,
  voteOnSighting: mockVoteOnSighting,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import HornetCommunityPage from '@/app/[locale]/hornets/community/page';

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

const sighting1 = {
  id: 's1',
  photo_url: 'https://example.com/photo1.jpg',
  description: 'Seen near the shed',
  reporter_name: 'Alex',
  latitude: null,
  longitude: null,
  status: 'pending' as const,
  yes_votes: 3,
  no_votes: 1,
  created_at: '2026-06-01T10:00:00',
};

describe('HornetCommunityPage', () => {
  beforeEach(() => {
    mockGetHornetSightings.mockReset();
    mockSubmitHornetSighting.mockReset();
    mockVoteOnSighting.mockReset();
    mockGetHornetSightings.mockResolvedValue({ items: [], total: 0, page: 1, per_page: 12, pages: 1 });
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows the empty state when there are no sightings', async () => {
    render(<HornetCommunityPage />);
    await waitFor(() => expect(screen.getByText('community.noSightings')).toBeTruthy());
  });

  it('renders sightings once loaded', async () => {
    mockGetHornetSightings.mockResolvedValue({ items: [sighting1], total: 1, page: 1, per_page: 12, pages: 1 });
    render(<HornetCommunityPage />);
    await waitFor(() => expect(screen.getByText('Seen near the shed')).toBeTruthy());
    expect(screen.getByText('— Alex')).toBeTruthy();
    expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.com/photo1.jpg');
  });

  it('toggles the submit form', async () => {
    render(<HornetCommunityPage />);
    await waitFor(() => expect(mockGetHornetSightings).toHaveBeenCalled());
    expect(screen.queryByText(/community.photo/)).toBeNull();
    fireEvent.click(screen.getByText('+ community.addPhoto'));
    expect(screen.getByText(/community.photo/)).toBeTruthy();
  });

  it('blocks submit with an error when no photo has been uploaded', async () => {
    render(<HornetCommunityPage />);
    fireEvent.click(screen.getByText('+ community.addPhoto'));
    fireEvent.click(screen.getByText('community.submitPhoto'));
    await waitFor(() => expect(screen.getByText('community.photoRequired')).toBeTruthy());
    expect(mockSubmitHornetSighting).not.toHaveBeenCalled();
  });

  it('uploads a photo then submits the sighting', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({ url: 'https://blob.example/photo.jpg' }));
    mockSubmitHornetSighting.mockResolvedValue(undefined);
    render(<HornetCommunityPage />);
    fireEvent.click(screen.getByText('+ community.addPhoto'));

    const file = new File(['x'], 'hornet.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/report.photoReady/)).toBeTruthy());
    expect(fetch).toHaveBeenCalledWith('/api/hornets/upload', expect.objectContaining({ method: 'POST' }));

    const description = screen.getByText('community.description').closest('label')!.querySelector('textarea')!;
    fireEvent.change(description, { target: { value: 'Big one' } });

    fireEvent.click(screen.getByText('community.submitPhoto'));

    await waitFor(() =>
      expect(mockSubmitHornetSighting).toHaveBeenCalledWith({
        photo_url: 'https://blob.example/photo.jpg',
        description: 'Big one',
        reporter_name: null,
      }),
    );
    await waitFor(() => expect(screen.getByText('community.submitSuccess')).toBeTruthy());
  });

  it('shows an error banner when the photo upload fails', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }));
    render(<HornetCommunityPage />);
    fireEvent.click(screen.getByText('+ community.addPhoto'));

    const file = new File(['x'], 'hornet.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText('report.uploadError')).toBeTruthy());
  });

  it('shows an error banner when submitting the sighting fails', async () => {
    vi.mocked(fetch).mockResolvedValue(ok({ url: 'https://blob.example/photo.jpg' }));
    mockSubmitHornetSighting.mockRejectedValue(new Error('network'));
    render(<HornetCommunityPage />);
    fireEvent.click(screen.getByText('+ community.addPhoto'));

    const file = new File(['x'], 'hornet.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText(/report.photoReady/)).toBeTruthy());

    fireEvent.click(screen.getByText('community.submitPhoto'));
    await waitFor(() => expect(screen.getByText('report.submitError')).toBeTruthy());
  });

  it('votes yes on a sighting and reloads the list', async () => {
    mockGetHornetSightings.mockResolvedValue({ items: [sighting1], total: 1, page: 1, per_page: 12, pages: 1 });
    mockVoteOnSighting.mockResolvedValue(undefined);
    render(<HornetCommunityPage />);
    await waitFor(() => expect(screen.getByText('Seen near the shed')).toBeTruthy());

    fireEvent.click(screen.getByText(/community.vote.yes/));
    await waitFor(() => expect(mockVoteOnSighting).toHaveBeenCalledWith('s1', 'yes'));
    await waitFor(() => expect(mockGetHornetSightings).toHaveBeenCalledTimes(2));
  });

  it('paginates to the next page', async () => {
    mockGetHornetSightings.mockResolvedValue({ items: [sighting1], total: 24, page: 1, per_page: 12, pages: 2 });
    render(<HornetCommunityPage />);
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeTruthy());

    fireEvent.click(screen.getByText('→'));
    await waitFor(() => expect(mockGetHornetSightings).toHaveBeenCalledWith(2));
  });
});
