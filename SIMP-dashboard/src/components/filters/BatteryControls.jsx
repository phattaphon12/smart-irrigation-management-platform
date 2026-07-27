const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'ok', label: 'Online' },
  { id: 'warn', label: 'Low Power' },
  { id: 'critical', label: 'Critical' },
];

const SORT_OPTIONS = [
  { id: 'id', label: 'Sensor ID' },
  { id: 'battery-asc', label: 'Battery ↑' },
  { id: 'battery-desc', label: 'Battery ↓' },
];

export default function BatteryControls({
  statusFilter,
  onChangeStatusFilter,
  sortBy,
  onChangeSortBy,
  shownCount,
  totalCount,
}) {
  return (
    <div className="chart-controls-inline" style={{ marginBottom: 16, flexWrap: 'wrap', rowGap: 10 }}>
      <div className="control-sub-item">
        <span className="ctl-label">Filter</span>
        <div className="fb-segmented">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`f-btn${statusFilter === f.id ? ' active' : ''}`}
              title={f.id === 'all' ? 'Show every node' : `Show only ${f.label.toLowerCase()} nodes`}
              onClick={() => onChangeStatusFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="control-sub-item">
        <span className="ctl-label">Sort</span>
        <div className="fb-segmented">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.id}
              className={`f-btn${sortBy === s.id ? ' active' : ''}`}
              onClick={() => onChangeSortBy(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, alignSelf: 'center' }}>
        Showing {shownCount} of {totalCount} nodes
      </div>
    </div>
  );
}
