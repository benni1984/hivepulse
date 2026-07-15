import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const mockInit = vi.hoisted(() => vi.fn());

vi.mock('aos', () => ({
  default: { init: mockInit },
}));

import AosInit from '@/components/AosInit';

describe('AosInit', () => {
  beforeEach(() => {
    mockInit.mockClear();
  });

  it('renders no visible output', () => {
    const { container } = render(<AosInit />);
    expect(container.innerHTML).toBe('');
  });

  it('initializes AOS with the expected options', async () => {
    render(<AosInit />);
    await waitFor(() => expect(mockInit).toHaveBeenCalledWith({ duration: 650, once: true, offset: 60 }));
  });
});
