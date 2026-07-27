const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function fetchLogs({ nodeCode, limit = 50, offset = 0 } = {}) {
  const url = new URL(`${BACKEND_URL}/api/logs`);
  if (nodeCode) url.searchParams.set('node_code', nodeCode);
  url.searchParams.set('limit', limit);
  url.searchParams.set('offset', offset);

  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { rows, total }
}

export async function deleteLog(id) {
  const res = await fetch(`${BACKEND_URL}/api/logs/${id}`, { method: 'DELETE' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

export async function recalculateLog(id) {
  const res = await fetch(`${BACKEND_URL}/api/logs/${id}/recalculate`, { method: 'POST' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

export async function recalculateAllLogs() {
  const res = await fetch(`${BACKEND_URL}/api/logs/recalculate-all`, { method: 'POST' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

export function buildExportUrl() {
  return `${BACKEND_URL}/api/logs/export.csv`;
}
