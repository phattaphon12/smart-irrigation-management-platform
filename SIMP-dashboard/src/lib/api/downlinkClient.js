const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Recent downlink command history (pending/sent/failed) — lets the Settings
// page show whether a queued LED/interval command has actually been picked
// up by Node-RED yet, since queuing no longer gets a synchronous confirmation.
export async function fetchDownlinkHistory() {
  const res = await fetch(`${BACKEND_URL}/api/downlink`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body.rows;
}
