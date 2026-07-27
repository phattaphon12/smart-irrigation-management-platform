const RANGES = [
  { id: '1d', label: '1D', hint: 'Last 1 day' },
  { id: '7d', label: '1W', hint: 'Last 7 days' },
  { id: '30d', label: '30D', hint: 'Last 30 days' },
  { id: 'all', label: 'All', hint: 'Everything available' },
];

export default function TimeRangeToggle({ range, onChange }) {
  return (
    <div className="fs">
      <div className="fl">Time Range</div>
      <div className="fb-segmented">
        {RANGES.map((r) => (
          <button
            key={r.id}
            className={`f-btn${range === r.id ? ' active' : ''}`}
            title={r.hint}
            onClick={() => onChange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
