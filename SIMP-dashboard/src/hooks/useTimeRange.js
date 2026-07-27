import { useMemo, useState } from 'react';

const RANGE_DAYS = { '1d': 1, '7d': 7, '30d': 30, all: null };

/**
 * Global 1D/1W/30D/All picker for the Graph Dashboard — anchored to the latest
 * date across the merged timeline (`labels`, from useTimelineLabels), not wall-
 * clock "today", so it still works sensibly against historical/mock data.
 */
export function useTimeRange(labels) {
  const [range, setRange] = useState('all'); // '1d' | '7d' | '30d' | 'all'

  const cutoffDate = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (days == null || labels.length === 0) return null;
    // labels may be plain dates ("2026-07-27") or full timestamps
    // ("2026-07-27T00:31:29") — only the date portion anchors the cutoff.
    const latestDate = labels[labels.length - 1].slice(0, 10);
    const latest = new Date(`${latestDate}T00:00:00Z`);
    latest.setUTCDate(latest.getUTCDate() - (days - 1));
    return latest.toISOString().slice(0, 10);
  }, [range, labels]);

  const filteredLabels = useMemo(() => {
    if (!cutoffDate) return labels;
    return labels.filter((l) => l >= cutoffDate);
  }, [labels, cutoffDate]);

  return { range, setRange, cutoffDate, filteredLabels };
}
