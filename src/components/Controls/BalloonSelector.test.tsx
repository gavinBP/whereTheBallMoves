import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BalloonSelector } from './BalloonSelector';
import type { BalloonTrack } from '../../types/track';

describe('BalloonSelector', () => {
  const mockTracks: BalloonTrack[] = [
    {
      trackId: 'track-1',
      points: [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          altitudeKm: 10,
          timestamp: new Date(),
          hour: 0,
        },
      ],
      startTime: new Date(),
      endTime: new Date(),
      durationHours: 1,
      totalDistanceKm: 100,
      averageSpeedKmh: 100,
      minAltitudeKm: 10,
      maxAltitudeKm: 10,
      altitudeRangeKm: 0,
    },
    {
      trackId: 'track-2',
      points: [
        {
          latitude: 34.0522,
          longitude: -118.2437,
          altitudeKm: 15,
          timestamp: new Date(),
          hour: 0,
        },
      ],
      startTime: new Date(),
      endTime: new Date(),
      durationHours: 1,
      totalDistanceKm: 200,
      averageSpeedKmh: 200,
      minAltitudeKm: 15,
      maxAltitudeKm: 15,
      altitudeRangeKm: 0,
    },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders the label and dropdown', () => {
    render(<BalloonSelector tracks={mockTracks} selectedTrackId={null} onSelect={mockOnSelect} />);

    expect(screen.getByText('Select Balloon:')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Balloon:')).toBeInTheDocument();
  });

  it('renders "All Balloons" option and track options', () => {
    render(<BalloonSelector tracks={mockTracks} selectedTrackId={null} onSelect={mockOnSelect} />);

    const select = screen.getByLabelText('Select Balloon:');
    expect(select).toBeInTheDocument();

    // Check that "All Balloons" option exists
    expect(screen.getByRole('option', { name: /All Balloons/i })).toBeInTheDocument();

    // Check that track options exist
    expect(screen.getByRole('option', { name: /track-1.*points/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /track-2.*points/i })).toBeInTheDocument();
  });

  it('displays "All Balloons" as selected when selectedTrackId is null', () => {
    render(<BalloonSelector tracks={mockTracks} selectedTrackId={null} onSelect={mockOnSelect} />);

    const select = screen.getByLabelText('Select Balloon:') as HTMLSelectElement;
    expect(select.value).toBe('all');
  });

  it('displays the selected track when selectedTrackId is provided', () => {
    render(
      <BalloonSelector tracks={mockTracks} selectedTrackId="track-1" onSelect={mockOnSelect} />
    );

    const select = screen.getByLabelText('Select Balloon:') as HTMLSelectElement;
    expect(select.value).toBe('track-1');
  });

  it('calls onSelect with null when "All Balloons" is selected', async () => {
    const user = userEvent.setup();
    render(
      <BalloonSelector tracks={mockTracks} selectedTrackId="track-1" onSelect={mockOnSelect} />
    );

    const select = screen.getByLabelText('Select Balloon:');
    await user.selectOptions(select, 'all');

    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('calls onSelect with trackId when a track is selected', async () => {
    const user = userEvent.setup();
    render(<BalloonSelector tracks={mockTracks} selectedTrackId={null} onSelect={mockOnSelect} />);

    const select = screen.getByLabelText('Select Balloon:');
    await user.selectOptions(select, 'track-2');

    expect(mockOnSelect).toHaveBeenCalledWith('track-2');
  });

  it('renders "All Balloons" button', () => {
    render(<BalloonSelector tracks={mockTracks} selectedTrackId={null} onSelect={mockOnSelect} />);

    expect(screen.getByRole('button', { name: /All Balloons/i })).toBeInTheDocument();
  });

  it('disables "All Balloons" button when no track is selected', () => {
    render(<BalloonSelector tracks={mockTracks} selectedTrackId={null} onSelect={mockOnSelect} />);

    const button = screen.getByRole('button', { name: /All Balloons/i });
    expect(button).toBeDisabled();
  });

  it('enables "All Balloons" button when a track is selected', () => {
    render(
      <BalloonSelector tracks={mockTracks} selectedTrackId="track-1" onSelect={mockOnSelect} />
    );

    const button = screen.getByRole('button', { name: /All Balloons/i });
    expect(button).not.toBeDisabled();
  });

  it('calls onSelect with null when "All Balloons" button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BalloonSelector tracks={mockTracks} selectedTrackId="track-1" onSelect={mockOnSelect} />
    );

    const button = screen.getByRole('button', { name: /All Balloons/i });
    await user.click(button);

    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('handles empty tracks array', () => {
    render(<BalloonSelector tracks={[]} selectedTrackId={null} onSelect={mockOnSelect} />);

    expect(screen.getByText('Select Balloon:')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /All Balloons/i })).toBeInTheDocument();
  });
});

