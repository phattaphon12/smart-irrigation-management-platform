/**
 * Weather data client — calls our own backend (sugarcane-backend), which proxies
 * Ambient Weather and holds apiKey/applicationKey/station MAC server-side (editable
 * from the Settings page). The browser never talks to Ambient Weather directly, so
 * credentials never appear in its Network tab.
 *
 * Pagination, rate-limit pacing, and gap-handling (§4.1 ของเอกสารอ้างอิง) all happen
 * server-side now (see sugarcane-backend/src/routes/weather.js) — the backend also
 * caches every record it fetches to data/weather-cache.json, so a repeat call only
 * fetches the gap since the last run instead of re-walking the whole window. This
 * client is just a single request + an AbortSignal so the caller can cancel it.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/**
 * @param {number} [sinceDays] - how many days of history to return (defaults to the
 *   backend's own default, currently 304 — the FAO-56 reference season length)
 * @param {AbortSignal} [signal] - cancels the in-flight request (e.g. on unmount)
 * @returns {Promise<Array>} ข้อมูลดิบ 1 นาที เรียงจากเก่า -> ใหม่
 */
export async function fetchWeatherHistory(sinceDays, signal) {
  const url = new URL(`${BACKEND_URL}/api/weather/history`);
  if (sinceDays != null) url.searchParams.set('sinceDays', sinceDays);

  const res = await fetch(url, { signal });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  }
  return body;
}

/**
 * Polled while fetchWeatherHistory() is in flight to show live progress
 * (a cold cache can take ~30min for the full 304-day window).
 * @returns {Promise<{active: boolean, recordsFetched: number, startedAt: number|null}>}
 */
export async function fetchWeatherProgress() {
  const res = await fetch(`${BACKEND_URL}/api/weather/progress`);
  if (!res.ok) throw new Error(`Backend error: HTTP ${res.status}`);
  return res.json();
}
