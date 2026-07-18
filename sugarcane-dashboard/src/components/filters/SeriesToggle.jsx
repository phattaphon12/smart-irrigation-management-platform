export default function SeriesToggle({ seriesOn, onToggleSeries, cumulative, onToggleCumulative }) {
  return (
    <div className="fb-segmented" style={{ maxWidth: 380 }}>
      <button
        className={`f-btn${seriesOn.eto ? ' active' : ''}`}
        style={{ color: '#ea580c' }}
        title="ETo — reference water loss from weather conditions (not crop-specific)"
        onClick={() => onToggleSeries('eto')}
      >
        ETo
      </button>
      <button
        className={`f-btn${seriesOn.etc ? ' active' : ''}`}
        style={{ color: '#dc2626' }}
        title="ETc — actual water the sugarcane uses each day"
        onClick={() => onToggleSeries('etc')}
      >
        ETc
      </button>
      <button
        className={`f-btn${seriesOn.rain ? ' active' : ''}`}
        style={{ color: '#2563eb' }}
        title="Rainfall recorded at the plot"
        onClick={() => onToggleSeries('rain')}
      >
        Rain
      </button>
      <button
        className={`f-btn${cumulative ? ' active' : ''}`}
        title="Switch to season-to-date cumulative totals"
        onClick={onToggleCumulative}
      >
        Cumulative
      </button>
    </div>
  );
}
