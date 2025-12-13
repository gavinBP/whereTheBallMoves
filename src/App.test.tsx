import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Where The Ball Moves/i)).toBeInTheDocument();
  });

  it('renders the WindBorne API Test section', () => {
    render(<App />);
    expect(screen.getByText(/WindBorne API Test/i)).toBeInTheDocument();
  });
});

