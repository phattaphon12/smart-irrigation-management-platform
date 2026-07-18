import { useMemo } from 'react';

/**
 * รวมวันที่ทั้งหมดจาก soil nodes + weather summary + water balance เป็นแกนเวลาเดียว (เรียงแล้ว)
 * ตรงกับแนวคิด `allDates` / `labels` ในไฟล์เดิม
 */
export function useTimelineLabels(soilNodes, weatherSummary, waterBalance) {
  return useMemo(() => {
    const dateSet = new Set();
    Object.values(soilNodes).forEach((node) => node.timestamps.forEach((t) => dateSet.add(t)));
    weatherSummary.timestamps.forEach((t) => dateSet.add(t));
    waterBalance.timestamps.forEach((t) => dateSet.add(t));
    return [...dateSet].sort();
  }, [soilNodes, weatherSummary, waterBalance]);
}
