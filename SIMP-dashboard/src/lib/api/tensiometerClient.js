const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function fetchTensiometerReadings() {
  const res = await fetch(`${BACKEND_URL}/api/tensiometer`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { rows }
}

export async function createTensiometerReading(payload) {
  const res = await fetch(`${BACKEND_URL}/api/tensiometer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { ok, row }
}

export async function deleteTensiometerReading(id) {
  const res = await fetch(`${BACKEND_URL}/api/tensiometer/${id}`, { method: 'DELETE' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

export function buildTensiometerExportUrl() {
  return `${BACKEND_URL}/api/tensiometer/export.csv`;
}
