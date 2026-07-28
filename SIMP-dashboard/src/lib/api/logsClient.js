const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function fetchLogs({ nodeCode, limit = 50, offset = 0, sort, dir, includeDeleted, source } = {}) {
  const url = new URL(`${BACKEND_URL}/api/logs`);
  if (nodeCode) url.searchParams.set('node_code', nodeCode);
  url.searchParams.set('limit', limit);
  url.searchParams.set('offset', offset);
  if (sort) url.searchParams.set('sort', sort);
  if (dir) url.searchParams.set('dir', dir);
  if (includeDeleted) url.searchParams.set('includeDeleted', 'true');
  if (source) url.searchParams.set('source', source);

  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { rows, total }
}

// Deletes here are soft (log.deleted) — see routes/logs.js — so every one of
// these has a matching restore* counterpart below.
export async function deleteLog(id) {
  const res = await fetch(`${BACKEND_URL}/api/logs/${id}`, { method: 'DELETE' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

export async function restoreLog(id) {
  const res = await fetch(`${BACKEND_URL}/api/logs/${id}/restore`, { method: 'POST' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

export async function bulkDeleteLogs(ids) {
  const res = await fetch(`${BACKEND_URL}/api/logs/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { ok, deleted }
}

export async function bulkRestoreLogs(ids) {
  const res = await fetch(`${BACKEND_URL}/api/logs/bulk-restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { ok, restored }
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

export async function clearAllLogs() {
  const res = await fetch(`${BACKEND_URL}/api/logs/clear-all`, { method: 'POST' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { ok, deleted }
}

export async function restoreAllLogs() {
  const res = await fetch(`${BACKEND_URL}/api/logs/restore-all`, { method: 'POST' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { ok, restored }
}

export function buildExportUrl() {
  return `${BACKEND_URL}/api/logs/export.csv`;
}
