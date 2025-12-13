import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeSelector } from './TimeSelector';

describe('TimeSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders the label and dropdown', () => {
    render(<TimeSelector selectedTime={null} onSelect={mockOnSelect} />);

    expect(screen.getByText('Select Time:')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Time:')).toBeInTheDocument();
  });

  it('renders all time options', () => {
    render(<TimeSelector selectedTime={null} onSelect={mockOnSelect} />);

    expect(screen.getByRole('option', { name: 'Full 24h History' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Now' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '1 hour ago' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2 hours ago' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '3 hours ago' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '6 hours ago' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '12 hours ago' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '18 hours ago' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '23 hours ago' })).toBeInTheDocument();
  });

  it('displays "Full 24h History" as selected when selectedTime is null', () => {
    render(<TimeSelector selectedTime={null} onSelect={mockOnSelect} />);

    const select = screen.getByLabelText('Select Time:') as HTMLSelectElement;
    expect(select.value).toBe('full');
  });

  it('displays the selected time when selectedTime is provided', () => {
    render(<TimeSelector selectedTime={6} onSelect={mockOnSelect} />);

    const select = screen.getByLabelText('Select Time:') as HTMLSelectElement;
    expect(select.value).toBe('6');
  });

  it('calls onSelect with null when "Full 24h History" is selected', async () => {
    const user = userEvent.setup();
    render(<TimeSelector selectedTime={6} onSelect={mockOnSelect} />);

    const select = screen.getByLabelText('Select Time:');
    await user.selectOptions(select, 'full');

    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('calls onSelect with the hour value when a time option is selected', async () => {
    const user = userEvent.setup();
    render(<TimeSelector selectedTime={null} onSelect={mockOnSelect} />);

    const select = screen.getByLabelText('Select Time:');
    await user.selectOptions(select, '12');

    expect(mockOnSelect).toHaveBeenCalledWith(12);
  });

  it('handles all time options correctly', async () => {
    const user = userEvent.setup();
    render(<TimeSelector selectedTime={null} onSelect={mockOnSelect} />);

    const select = screen.getByLabelText('Select Time:');

    const timeOptions = [0, 1, 2, 3, 6, 12, 18, 23];
    for (const time of timeOptions) {
      await user.selectOptions(select, String(time));
      expect(mockOnSelect).toHaveBeenCalledWith(time);
      mockOnSelect.mockClear();
    }
  });
});

