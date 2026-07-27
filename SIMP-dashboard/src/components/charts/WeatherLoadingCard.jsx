import { useEffect, useState } from 'react';

function elapsedLabel(startedAt) {
  if (!startedAt) return null;
  const secs = Math.round((Date.now() - startedAt) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function WeatherLoadingCard({ progress }) {
  // re-render every second purely to keep the elapsed-time counter ticking
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="chart-card">
      <div className="chart-hd">
        <div>
          <div className="chart-ttl">Water Use & Rainfall (mm/day)</div>
          <div className="chart-sub">Daily data from the plot's automatic weather station</div>
        </div>
      </div>
      <div className="weather-loading">
        <div className="spinner" />
        <div className="weather-loading-title">Fetching weather data from the station…</div>
        <div className="weather-loading-detail">
          {progress?.recordsFetched
            ? `Fetched ${progress.recordsFetched.toLocaleString()} records`
            : 'Connecting to station…'}
          {progress?.startedAt && ` · ${elapsedLabel(progress.startedAt)}`}
        </div>
        <div className="weather-loading-hint">
          The first load can take up to ~30 minutes (304 days of history) — subsequent loads will be much faster thanks to caching.
        </div>
      </div>
    </div>
  );
}
