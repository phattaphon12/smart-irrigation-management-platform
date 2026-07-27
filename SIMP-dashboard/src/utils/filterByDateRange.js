/**
 * Trims weatherSummary/waterBalance to entries on/after cutoffDate (YYYY-MM-DD,
 * string-comparable) — used by useTimeRange to make the 1D/1W/30D/All picker
 * apply consistently across all 3 Graph Dashboard charts. Pass cutoffDate=null
 * to mean "All" (returns the input unchanged).
 */

function pickIndices(timestamps, cutoffDate) {
  const keep = [];
  timestamps.forEach((t, i) => {
    if (t >= cutoffDate) keep.push(i);
  });
  return keep;
}

export function filterWeatherSummary(summary, cutoffDate) {
  if (!cutoffDate) return summary;
  const keep = pickIndices(summary.timestamps, cutoffDate);
  const pick = (arr) => keep.map((i) => arr[i]);
  return {
    timestamps: pick(summary.timestamps),
    eto: pick(summary.eto),
    etc: pick(summary.etc),
    rain: pick(summary.rain),
    cum_eto: pick(summary.cum_eto),
    cum_etc: pick(summary.cum_etc),
    cum_rain: pick(summary.cum_rain),
  };
}

export function filterWaterBalance(waterBalance, cutoffDate) {
  if (!cutoffDate) return waterBalance;
  const keep = pickIndices(waterBalance.timestamps, cutoffDate);
  const pick = (arr) => keep.map((i) => arr[i]);
  return {
    timestamps: pick(waterBalance.timestamps),
    dstorage: pick(waterBalance.dstorage),
    rain: pick(waterBalance.rain),
    etc: pick(waterBalance.etc),
    // sparse, keyed by date rather than parallel to timestamps — filter directly
    irrigation_events: (waterBalance.irrigation_events || []).filter((ev) => ev.date >= cutoffDate),
  };
}
