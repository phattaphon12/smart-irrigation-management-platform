export default function LoadingScreen() {
  return (
    <div className="app-loading">
      <div className="spinner" />
      <div className="app-loading-title">Loading sensor data…</div>
      <div className="app-loading-hint">Connecting to the backend — the dashboard will appear as soon as data arrives.</div>
    </div>
  );
}
