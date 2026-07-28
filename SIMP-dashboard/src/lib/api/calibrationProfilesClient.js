const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function fetchCalibrationProfiles() {
  const res = await fetch(`${BACKEND_URL}/api/calibration-profiles`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { rows }
}

export async function saveCalibrationProfile(payload) {
  const res = await fetch(`${BACKEND_URL}/api/calibration-profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { ok, profile }
}

export async function loadCalibrationProfile(id) {
  const res = await fetch(`${BACKEND_URL}/api/calibration-profiles/${id}/load`, { method: 'POST' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body; // { ok, calibration, crop }
}

export async function deleteCalibrationProfile(id) {
  const res = await fetch(`${BACKEND_URL}/api/calibration-profiles/${id}`, { method: 'DELETE' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}
