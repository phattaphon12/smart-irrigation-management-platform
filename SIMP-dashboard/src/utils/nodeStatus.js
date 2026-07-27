// A sensor is "offline" once its latest reading is older than this — matches
// the ~1-reading-per-minute field cadence with generous slack for a missed report.
export const OFFLINE_THRESHOLD_MS = 60 * 60 * 1000;

export function lastReadingTime(node) {
  const ts = node?.timestamps;
  if (!ts || ts.length === 0) return null;
  const last = new Date(ts[ts.length - 1]);
  return Number.isNaN(last.getTime()) ? null : last.getTime();
}

export function isNodeOffline(node, now = Date.now()) {
  const last = lastReadingTime(node);
  if (last == null) return true; // never reported = offline
  return now - last > OFFLINE_THRESHOLD_MS;
}
