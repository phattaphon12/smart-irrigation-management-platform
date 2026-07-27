/**
 * In-memory progress for the currently running (if any) /api/weather/history
 * pagination walk — polled by the frontend so a long cold-cache fetch (first run
 * can take ~30min for 304 days) shows a live "records fetched so far" count
 * instead of a bare, indefinite spinner.
 */

let progress = { active: false, recordsFetched: 0, startedAt: null, updatedAt: null };

export function startProgress() {
  progress = { active: true, recordsFetched: 0, startedAt: Date.now(), updatedAt: Date.now() };
}

export function updateProgress(recordsFetched) {
  progress = { ...progress, recordsFetched, updatedAt: Date.now() };
}

export function finishProgress() {
  progress = { ...progress, active: false, updatedAt: Date.now() };
}

export function getProgress() {
  return { ...progress };
}
