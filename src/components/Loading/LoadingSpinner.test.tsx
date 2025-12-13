import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Fetching balloon data..." />);

    expect(screen.getByText('Fetching balloon data...')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders the spinner element', () => {
    const { container } = render(<LoadingSpinner />);

    // Check that the spinner div exists (it has inline styles, so we check by structure)
    const spinner = container.querySelector('div[style*="border"]');
    expect(spinner).toBeInTheDocument();
  });

  it('applies custom message correctly', () => {
    const customMessage = 'Please wait...';
    render(<LoadingSpinner message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });
});

