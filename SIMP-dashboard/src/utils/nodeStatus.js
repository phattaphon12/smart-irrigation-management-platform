// A sensor is "offline" once its latest reading is older than this — 3x the
// real ~15-minute field reporting interval (dev_reference_sensor_et_v1.md
// §1), so it tolerates a couple of missed reports before flagging offline.
export const OFFLINE_THRESHOLD_MS = 45 * 60 * 1000;

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

// Consecutive readings pinned at the calibration clip floor (default -200 kPa,
// matching calibration_config.kpa_clip_min's seeded value — pass the live
// value in if it's been edited) point at a stuck/failed sensor rather than
// genuinely extreme drought, per dev_reference_sensor_et_v1.md §4.6.
const STUCK_STREAK = 4; // ~1 hour at the real 15-min reporting interval

export function isNodeStuckAtFloor(node, clipValue = -200, streak = STUCK_STREAK) {
  const kpa = node?.kpa;
  if (!kpa || kpa.length < streak) return false;
  return kpa.slice(-streak).every((v) => v === clipValue);
}
