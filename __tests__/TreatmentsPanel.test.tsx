import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TreatmentsPanel from '@/components/TreatmentsPanel';

const mockGet = vi.hoisted(() => vi.fn());
const mockCreate = vi.hoisted(() => vi.fn());
const mockDone = vi.hoisted(() => vi.fn());
const mockReopen = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) =>
    params ? `${key}|${Object.values(params).join('|')}` : key,
}));

vi.mock('@/lib/api', () => ({
  getTreatments: mockGet,
  createTreatment: mockCreate,
  markTreatmentDone: mockDone,
  reopenTreatment: mockReopen,
  deleteTreatment: mockDelete,
}));

const treatment = (id: string, over: Record<string, unknown> = {}) => ({
  id, target: { type: 'hive', id: 'h-1', name: 'Hive 1' }, apiary_name: 'Garden', product: `Product ${id}`,
  due_on: '2026-08-20', note: null, done_on: null, overdue: false, created_by_name: 'Alice', created_at: '2026-08-01T00:00:00', ...over,
});

/** The server answers open and done separately; the panel asks for both. */
function serve(open: unknown[], done: unknown[] = []) {
  mockGet.mockImplementation(async (filter: { status?: string }) => (filter.status === 'done' ? done : open));
}

describe('TreatmentsPanel', () => {
  beforeEach(() => {
    [mockGet, mockCreate, mockDone, mockReopen, mockDelete].forEach(m => m.mockReset());
  });
  afterEach(() => vi.restoreAllMocks());

  it('asks for the treatments of the hive or of the apiary it sits on', async () => {
    serve([]);
    const { unmount } = render(<TreatmentsPanel type="hive" id="h-1" />);
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith({ status: 'open', hive_id: 'h-1' }));
    expect(mockGet).toHaveBeenCalledWith({ status: 'done', hive_id: 'h-1' });
    unmount();

    render(<TreatmentsPanel type="apiary" id="a-1" />);
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith({ status: 'open', apiary_id: 'a-1' }));
    expect(screen.getByText('treatments.introApiary')).toBeInTheDocument();
  });

  it('says so when nothing is planned', async () => {
    serve([]);
    render(<TreatmentsPanel type="hive" id="h-1" />);

    await waitFor(() => screen.getByText('treatments.empty'));
  });

  it('lists what is planned, and marks what is overdue', async () => {
    serve([treatment('a'), treatment('b', { overdue: true, note: 'evening' })]);
    render(<TreatmentsPanel type="hive" id="h-1" />);

    await waitFor(() => screen.getByText('Product a'));
    expect(screen.getByText('Product b')).toBeInTheDocument();
    expect(screen.getAllByText(/treatments\.dueOnDate/)).toHaveLength(1);
    expect(screen.getAllByText(/treatments\.overdue/)).toHaveLength(1);
    expect(screen.getByText(/evening/)).toBeInTheDocument();
  });

  it('plans a treatment with the product, the day and a note, and reloads', async () => {
    serve([]);
    mockCreate.mockResolvedValue(treatment('new'));
    render(<TreatmentsPanel type="hive" id="h-1" />);
    await waitFor(() => screen.getByText('treatments.empty'));

    fireEvent.click(screen.getByText('treatments.plan'));
    fireEvent.change(screen.getByLabelText('treatments.product'), { target: { value: ' Oxalic acid ' } });
    fireEvent.change(screen.getByLabelText('treatments.dueOn'), { target: { value: '2026-12-10' } });
    fireEvent.change(screen.getByLabelText('treatments.note'), { target: { value: ' dusk ' } });
    serve([treatment('new', { product: 'Oxalic acid' })]);
    fireEvent.click(screen.getByText('treatments.save'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({
      hive_id: 'h-1', product: 'Oxalic acid', due_on: '2026-12-10', note: 'dusk',
    }));
    await waitFor(() => screen.getByText('Oxalic acid'));
    expect(screen.queryByLabelText('treatments.product')).toBeNull();      // the form closed
  });

  it('plans for the apiary when it sits on an apiary', async () => {
    serve([]);
    mockCreate.mockResolvedValue(treatment('new'));
    render(<TreatmentsPanel type="apiary" id="a-1" />);
    await waitFor(() => screen.getByText('treatments.empty'));

    fireEvent.click(screen.getByText('treatments.plan'));
    fireEvent.change(screen.getByLabelText('treatments.product'), { target: { value: 'Thymol' } });
    fireEvent.click(screen.getByText('treatments.save'));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate.mock.calls[0][0].apiary_id).toBe('a-1');
    expect(mockCreate.mock.calls[0][0].hive_id).toBeUndefined();
    expect(mockCreate.mock.calls[0][0].note).toBeUndefined();
  });

  it('cannot be saved without a product', async () => {
    serve([]);
    render(<TreatmentsPanel type="hive" id="h-1" />);
    await waitFor(() => screen.getByText('treatments.empty'));

    fireEvent.click(screen.getByText('treatments.plan'));
    fireEvent.change(screen.getByLabelText('treatments.product'), { target: { value: '   ' } });

    expect(screen.getByText('treatments.save').closest('button')).toBeDisabled();
  });

  it('shows the server\'s reason when planning is refused, and keeps the form', async () => {
    serve([]);
    mockCreate.mockRejectedValue(new Error('Only the owner can do this.'));
    render(<TreatmentsPanel type="apiary" id="a-1" />);
    await waitFor(() => screen.getByText('treatments.empty'));

    fireEvent.click(screen.getByText('treatments.plan'));
    fireEvent.change(screen.getByLabelText('treatments.product'), { target: { value: 'x' } });
    fireEvent.click(screen.getByText('treatments.save'));

    await waitFor(() => screen.getByText('Only the owner can do this.'));
    expect(screen.getByLabelText('treatments.product')).toBeInTheDocument();
  });

  it('marks a treatment done and reloads', async () => {
    serve([treatment('a')]);
    mockDone.mockResolvedValue(treatment('a', { done_on: '2026-10-07' }));
    render(<TreatmentsPanel type="hive" id="h-1" />);
    await waitFor(() => screen.getByText('Product a'));

    serve([], [treatment('a', { done_on: '2026-10-07' })]);
    fireEvent.click(screen.getByText('treatments.markDone'));

    await waitFor(() => expect(mockDone).toHaveBeenCalledWith('a'));
    await waitFor(() => screen.getByText('treatments.reopen'));
    expect(screen.getByText('treatments.doneTitle')).toBeInTheDocument();
  });

  it('reopens a treatment that was marked done', async () => {
    serve([], [treatment('a', { done_on: '2026-10-07' })]);
    mockReopen.mockResolvedValue(treatment('a'));
    render(<TreatmentsPanel type="hive" id="h-1" />);
    await waitFor(() => screen.getByText('treatments.reopen'));

    serve([treatment('a')]);
    fireEvent.click(screen.getByText('treatments.reopen'));

    await waitFor(() => expect(mockReopen).toHaveBeenCalledWith('a'));
    await waitFor(() => screen.getByText('treatments.markDone'));
  });

  it('shows only the last five that were done', async () => {
    serve([], ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(id => treatment(id, { done_on: '2026-10-07' })));
    render(<TreatmentsPanel type="hive" id="h-1" />);

    await waitFor(() => screen.getByText('Product a'));
    expect(screen.queryByText('Product f')).toBeNull();
    expect(screen.getAllByText('treatments.reopen')).toHaveLength(5);
  });

  it('deletes after the confirmation, and does nothing when it is declined', async () => {
    serve([treatment('a')]);
    mockDelete.mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<TreatmentsPanel type="hive" id="h-1" />);
    await waitFor(() => screen.getByText('Product a'));

    fireEvent.click(screen.getByText('treatments.delete'));
    expect(confirm).toHaveBeenCalledWith('treatments.confirmDelete');
    expect(mockDelete).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    serve([]);
    fireEvent.click(screen.getByText('treatments.delete'));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('a'));
    await waitFor(() => expect(screen.queryByText('Product a')).toBeNull());
  });

  it('says so when the treatments cannot be loaded', async () => {
    mockGet.mockImplementation(() => Promise.reject(new Error('down')));
    render(<TreatmentsPanel type="hive" id="h-1" />);

    await waitFor(() => screen.getByText('treatments.errorGeneric'));
  });

  it('uses classes of its own, so "the form button" on the apiary and hive pages is still just one', async () => {
    serve([treatment('a')]);
    const { container } = render(<TreatmentsPanel type="hive" id="h-1" />);
    await waitFor(() => screen.getByText('Product a'));
    fireEvent.click(screen.getByText('treatments.plan'));

    for (const clashing of ['.dash-inline-form', '.dash-submit-btn', '.dash-cancel-btn', '.dash-new-btn',
      '.dash-row-btn', '.dash-row-btn-danger', '.dash-profile-select', 'table']) {
      expect(container.querySelector(clashing), clashing).toBeNull();
    }
  });
});
