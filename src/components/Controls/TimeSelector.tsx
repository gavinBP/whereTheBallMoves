interface TimeSelectorProps {
  selectedTime: number | null; // null = full history, number = hours ago
  onSelect: (time: number | null) => void;
}

/**
 * Dropdown component for selecting time
 */
export function TimeSelector({ selectedTime, onSelect }: TimeSelectorProps) {
  const timeOptions = [
    { label: 'Full 24h History', value: null },
    { label: 'Now', value: 0 },
    { label: '1 hour ago', value: 1 },
    { label: '2 hours ago', value: 2 },
    { label: '3 hours ago', value: 3 },
    { label: '6 hours ago', value: 6 },
    { label: '12 hours ago', value: 12 },
    { label: '18 hours ago', value: 18 },
    { label: '23 hours ago', value: 23 },
  ];

  return (
    <div style={{ marginBottom: '10px' }}>
      <label
        htmlFor="time-select"
        style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333' }}
      >
        Select Time:
      </label>
      <select
        id="time-select"
        value={selectedTime === null ? 'full' : selectedTime}
        onChange={(e) => {
          const value = e.target.value;
          onSelect(value === 'full' ? null : parseInt(value, 10));
        }}
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          width: '100%',
          maxWidth: '300px',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      >
        {timeOptions.map((option) => (
          <option key={option.label} value={option.value === null ? 'full' : option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

