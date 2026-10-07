import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MoveHivesPanel from '@/components/MoveHivesPanel';

const mockGetApiaries = vi.hoisted(() => vi.fn());
const mockMoveHives = vi.hoisted(() => vi.fn());

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string | number>) =>
    params ? `${key}|${Object.values(params).join('|')}` : key,
}));

vi.mock('@/lib/api', () => ({
  getApiaries: mockGetApiaries,
  moveHives: mockMoveHives,
}));

const hives = [
  { id: 'h-1', name: 'Hive 1', hive_type: 'langstroth', apiary_id: 'a-home' },
  { id: 'h-2', name: 'Hive 2', hive_type: 'dadant', apiary_id: 'a-home' },
];
const apiaries = {
  items: [
    { id: 'a-home', name: 'Home', hive_count: 2, is_public: false, access: 'owner' },
    { id: 'a-heath', name: 'Heath', hive_count: 0, is_public: false, access: 'owner' },
    { id: 'a-theirs', name: 'Theirs', hive_count: 1, is_public: false, access: 'shared' },
  ],
  total: 3, page: 1, per_page: 20,
};
const result = { moved: 2, apiary: { id: 'a-heath', name: 'Heath' }, moves: [] };

async function open(props: Partial<React.ComponentProps<typeof MoveHivesPanel>> = {}) {
  const onMoved = vi.fn();
  const onCancel = vi.fn();
  render(<MoveHivesPanel apiaryId="a-home" hives={hives as never} onMoved={onMoved} onCancel={onCancel} {...props} />);
  await waitFor(() => expect(mockGetApiaries).toHaveBeenCalled());
  return { onMoved, onCancel };
}

describe('MoveHivesPanel', () => {
  beforeEach(() => {
    mockGetApiaries.mockReset();
    mockMoveHives.mockReset();
    mockGetApiaries.mockResolvedValue(apiaries);
  });

  it('offers only the caller\'s other apiaries as targets', async () => {
    await open();

    await waitFor(() => screen.getByRole('option', { name: 'Heath' }));
    expect(screen.queryByRole('option', { name: 'Home' })).toBeNull();     // where the hives already are
    expect(screen.queryByRole('option', { name: 'Theirs' })).toBeNull();   // somebody else's
    expect(screen.getByRole('option', { name: 'moves.targetNew' })).toBeInTheDocument();
  });

  it('cannot be sent before hives and a target are chosen', async () => {
    await open();

    const submit = screen.getByText(/^moves\.submit/).closest('button')!;
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Hive 1'));
    expect(submit).toBeDisabled();            // still no target

    fireEvent.change(screen.getByLabelText('moves.target'), { target: { value: 'a-heath' } });
    expect(submit).not.toBeDisabled();
  });

  it('selects all hives at once and counts them in the button', async () => {
    await open();

    fireEvent.click(screen.getByLabelText('moves.selectAll'));

    expect(screen.getByText('moves.submit|2')).toBeInTheDocument();
    expect((screen.getByLabelText('Hive 2') as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByLabelText('moves.selectAll'));
    expect(screen.getByText('moves.submit|0')).toBeInTheDocument();
  });

  it('moves the chosen hives to an existing apiary with date, forage and note', async () => {
    mockMoveHives.mockResolvedValue(result);
    const { onMoved } = await open();
    await waitFor(() => screen.getByRole('option', { name: 'Heath' }));

    fireEvent.click(screen.getByLabelText('Hive 1'));
    fireEvent.click(screen.getByLabelText('Hive 2'));
    fireEvent.change(screen.getByLabelText('moves.target'), { target: { value: 'a-heath' } });
    fireEvent.change(screen.getByLabelText('moves.date'), { target: { value: '2026-05-12' } });
    fireEvent.change(screen.getByLabelText('moves.forage'), { target: { value: 'acacia' } });
    fireEvent.change(screen.getByLabelText('moves.note'), { target: { value: ' early bloom ' } });
    fireEvent.click(screen.getByText('moves.submit|2'));

    await waitFor(() => expect(mockMoveHives).toHaveBeenCalledWith({
      hive_ids: ['h-1', 'h-2'], to_apiary_id: 'a-heath', moved_on: '2026-05-12', forage: 'acacia', note: 'early bloom',
    }));
    await waitFor(() => expect(onMoved).toHaveBeenCalledWith(result));
  });

  it('can make a new place on the way', async () => {
    mockMoveHives.mockResolvedValue(result);
    await open();
    await waitFor(() => screen.getByRole('option', { name: 'Heath' }));

    fireEvent.click(screen.getByLabelText('Hive 1'));
    fireEvent.change(screen.getByLabelText('moves.target'), { target: { value: '__new__' } });
    const submit = screen.getByText(/^moves\.submit/).closest('button')!;
    expect(submit).toBeDisabled();                       // a new place needs a name

    fireEvent.change(screen.getByLabelText('moves.newName'), { target: { value: ' Black Forest ' } });
    fireEvent.change(screen.getByLabelText('moves.newAddress'), { target: { value: 'Titisee' } });
    fireEvent.click(submit);

    await waitFor(() => expect(mockMoveHives).toHaveBeenCalled());
    const sent = mockMoveHives.mock.calls[0][0];
    expect(sent.new_apiary).toEqual({ name: 'Black Forest', address: 'Titisee' });
    expect(sent.to_apiary_id).toBeUndefined();
  });

  it('sends a forage typed by hand as written', async () => {
    mockMoveHives.mockResolvedValue(result);
    await open();
    await waitFor(() => screen.getByRole('option', { name: 'Heath' }));

    fireEvent.click(screen.getByLabelText('Hive 1'));
    fireEvent.change(screen.getByLabelText('moves.target'), { target: { value: 'a-heath' } });
    fireEvent.change(screen.getByLabelText('moves.forage'), { target: { value: '__other__' } });
    fireEvent.change(screen.getByLabelText('moves.forageOther'), { target: { value: ' Robinie ' } });
    fireEvent.click(screen.getByText('moves.submit|1'));

    await waitFor(() => expect(mockMoveHives.mock.calls[0][0].forage).toBe('Robinie'));
  });

  it('sends no forage when none was chosen', async () => {
    mockMoveHives.mockResolvedValue(result);
    await open();
    await waitFor(() => screen.getByRole('option', { name: 'Heath' }));

    fireEvent.click(screen.getByLabelText('Hive 1'));
    fireEvent.change(screen.getByLabelText('moves.target'), { target: { value: 'a-heath' } });
    fireEvent.click(screen.getByText('moves.submit|1'));

    await waitFor(() => expect(mockMoveHives).toHaveBeenCalled());
    expect(mockMoveHives.mock.calls[0][0].forage).toBeUndefined();
  });

  it('shows the server\'s reason and keeps the form when the move is refused', async () => {
    mockMoveHives.mockRejectedValue(new Error('Only the owner can do this.'));
    const { onMoved } = await open();
    await waitFor(() => screen.getByRole('option', { name: 'Heath' }));

    fireEvent.click(screen.getByLabelText('Hive 1'));
    fireEvent.change(screen.getByLabelText('moves.target'), { target: { value: 'a-heath' } });
    fireEvent.click(screen.getByText('moves.submit|1'));

    await waitFor(() => screen.getByText('Only the owner can do this.'));
    expect(onMoved).not.toHaveBeenCalled();
    expect(screen.getByTestId('move-panel')).toBeInTheDocument();
  });

  it('can be cancelled', async () => {
    const { onCancel } = await open();

    fireEvent.click(screen.getByText('moves.cancel'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('uses classes of its own, so "the form button" on the apiary page is still just one', async () => {
    await open();
    const root = screen.getByTestId('move-panel');

    expect(root.matches('.dash-inline-form')).toBe(false);
    expect(root.querySelector('.dash-inline-form, .dash-submit-btn, .dash-cancel-btn')).toBeNull();
  });
});
