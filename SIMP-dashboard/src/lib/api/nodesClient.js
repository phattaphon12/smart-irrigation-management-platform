const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function fetchNodes() {
  const res = await fetch(`${BACKEND_URL}/api/nodes`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

export async function createNode(payload) {
  const res = await fetch(`${BACKEND_URL}/api/nodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

export async function updateNode(nodeId, payload) {
  const res = await fetch(`${BACKEND_URL}/api/nodes/${nodeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

export async function deleteNode(nodeId) {
  const res = await fetch(`${BACKEND_URL}/api/nodes/${nodeId}`, { method: 'DELETE' });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}

// command: 'led' (value: 0|1) or 'time' (value: positive integer minutes) —
// bridged to the physical device via Node-RED's downlink webhook.
export async function sendDownlink(nodeId, command, value) {
  const res = await fetch(`${BACKEND_URL}/api/nodes/${nodeId}/downlink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, value }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  return body;
}
