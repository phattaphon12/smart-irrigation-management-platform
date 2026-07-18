const MODES = [
  { id: 'kpa', label: 'kPa', hint: 'Soil water tension — the more negative, the drier the soil' },
  { id: 'vwc', label: 'VWC', hint: 'Volumetric water content (share of water per soil volume)' },
  { id: 'awc', label: '%AWC', hint: 'Percent of water still available to the crop — the closer to 0%, the more urgent irrigation is' },
];

export default function ViewModeToggle({ viewMode, onChange }) {
  return (
    <div className="fs">
      <div className="fl">Soil Moisture Display Unit</div>
      <div className="fb-segmented">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className={`f-btn${viewMode === mode.id ? ' active' : ''}`}
            title={mode.hint}
            onClick={() => onChange(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
