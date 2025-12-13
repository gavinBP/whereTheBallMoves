import type { BalloonTrack } from '../../types/track';

interface BalloonSelectorProps {
  tracks: BalloonTrack[];
  selectedTrackId: string | null;
  onSelect: (trackId: string | null) => void;
}

/**
 * Dropdown component for selecting balloons
 */
export function BalloonSelector({
  tracks,
  selectedTrackId,
  onSelect,
}: BalloonSelectorProps) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <label
        htmlFor="balloon-select"
        style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333' }}
      >
        Select Balloon:
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          id="balloon-select"
          value={selectedTrackId || 'all'}
          onChange={(e) => {
            const value = e.target.value;
            onSelect(value === 'all' ? null : value);
          }}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            flex: 1,
            maxWidth: '300px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="all">All Balloons</option>
          {tracks.map((track) => (
            <option key={track.trackId} value={track.trackId}>
              {track.trackId} ({track.points.length} points)
            </option>
          ))}
        </select>
        <button
          onClick={() => onSelect(null)}
          disabled={selectedTrackId === null}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: selectedTrackId === null ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedTrackId === null ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          All Balloons
        </button>
      </div>
    </div>
  );
}

