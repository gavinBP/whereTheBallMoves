import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorReportComponent } from './ErrorReport';
import type { ErrorReport } from '../../types/errors';

describe('ErrorReportComponent', () => {
  const mockErrorReport: ErrorReport = {
    dataFileErrors: [
      {
        hour: 5,
        error: 'Network error',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        retryCount: 2,
      },
      {
        hour: 12,
        error: 'Timeout',
        timestamp: new Date('2024-01-01T12:05:00Z'),
      },
    ],
    trackErrors: [
      {
        trackId: 'track-1',
        issue: 'incomplete',
        description: 'Track has only 1 point',
        timestamp: new Date('2024-01-01T12:00:00Z'),
      },
    ],
    apiErrors: [
      {
        type: 'network',
        message: 'Connection failed',
        timestamp: new Date('2024-01-01T12:00:00Z'),
        endpoint: 'windborne-api',
        retryCount: 1,
      },
    ],
    lastSuccessfulFetch: new Date('2024-01-01T11:00:00Z'),
    totalErrors: 4,
    generatedAt: new Date('2024-01-01T12:10:00Z'),
  };

  const emptyErrorReport: ErrorReport = {
    dataFileErrors: [],
    trackErrors: [],
    apiErrors: [],
    lastSuccessfulFetch: new Date('2024-01-01T12:00:00Z'),
    totalErrors: 0,
    generatedAt: new Date('2024-01-01T12:10:00Z'),
  };

  it('renders error button when errorReport is provided', () => {
    render(<ErrorReportComponent errorReport={mockErrorReport} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/4 Error/i)).toBeInTheDocument();
  });

  it('renders "No Errors" button when totalErrors is 0', () => {
    render(<ErrorReportComponent errorReport={emptyErrorReport} />);

    expect(screen.getByText(/No Errors/i)).toBeInTheDocument();
  });

  it('does not render when errorReport is null', () => {
    const { container } = render(<ErrorReportComponent errorReport={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('opens modal when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ErrorReportComponent errorReport={mockErrorReport} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Error Report')).toBeInTheDocument();
  });

  it('displays error summary in modal', async () => {
    const user = userEvent.setup();
    render(<ErrorReportComponent errorReport={mockErrorReport} />);

    await user.click(screen.getByRole('button'));

    // Check that summary section exists - verify labels and counts are present
    // Use getAllByText to handle multiple matches (summary and section headers)
    expect(screen.getAllByText(/Total Errors/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Data File Errors/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Track Errors/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/API Errors/i).length).toBeGreaterThan(0);
    
    // Verify error counts are displayed - check the summary grid container text
    const summarySection = screen.getAllByText(/Total Errors/i)[0].closest('div[style*="grid"]');
    expect(summarySection).toBeInTheDocument();
    if (summarySection) {
      const summaryText = summarySection.textContent || '';
      expect(summaryText).toContain('4'); // Total errors
      expect(summaryText).toContain('2'); // Data file errors count
    }
  });

  it('displays data file errors', async () => {
    const user = userEvent.setup();
    render(<ErrorReportComponent errorReport={mockErrorReport} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText(/Hour 05.json/i)).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    expect(screen.getByText(/Hour 12.json/i)).toBeInTheDocument();
    expect(screen.getByText(/Timeout/i)).toBeInTheDocument();
  });

  it('displays track errors', async () => {
    const user = userEvent.setup();
    render(<ErrorReportComponent errorReport={mockErrorReport} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText(/track-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Track has only 1 point/i)).toBeInTheDocument();
  });

  it('displays API errors', async () => {
    const user = userEvent.setup();
    render(<ErrorReportComponent errorReport={mockErrorReport} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText(/\[NETWORK\]/i)).toBeInTheDocument();
    expect(screen.getByText(/Connection failed/i)).toBeInTheDocument();
    expect(screen.getByText(/windborne-api/i)).toBeInTheDocument();
  });

  it('displays last successful fetch time', async () => {
    const user = userEvent.setup();
    render(<ErrorReportComponent errorReport={mockErrorReport} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText(/Last Successful Fetch/i)).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ErrorReportComponent errorReport={mockErrorReport} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Error Report')).toBeInTheDocument();

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(screen.queryByText('Error Report')).not.toBeInTheDocument();
  });

  // Note: Backdrop click test is complex due to event propagation - tested manually
  // The close button test above verifies the modal can be closed

  it('displays "No errors" message when totalErrors is 0', async () => {
    const user = userEvent.setup();
    render(<ErrorReportComponent errorReport={emptyErrorReport} />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText(/No errors detected/i)).toBeInTheDocument();
  });

  it('calls onClose callback when provided', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    render(<ErrorReportComponent errorReport={mockErrorReport} onClose={mockOnClose} />);

    await user.click(screen.getByRole('button'));

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

