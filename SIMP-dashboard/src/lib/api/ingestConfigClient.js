const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function fetchIngestConfig() {
  const res = await fetch(`${BACKEND_URL}/api/config/ingest`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { dataSource, updatedAt }
}

export async function updateIngestConfig(payload) {
  const res = await fetch(`${BACKEND_URL}/api/config/ingest`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}
