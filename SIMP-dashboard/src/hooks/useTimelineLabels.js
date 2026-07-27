import { useMemo } from 'react';

/**
 * แกนเวลาของกราฟ Soil Tension — รวมเฉพาะ timestamp จาก soil nodes เท่านั้น (ไม่รวม weather/water
 * balance ซึ่งมีแกนเวลาของตัวเองอยู่แล้วและเป็นรายวัน ในขณะที่ soil node เป็น timestamp ละเอียดถึงเวลา
 * — ผสมกันจะทำให้แกน x ของกราฟ soil ถูกดึงไปครอบคลุมช่วงวันที่ของ weather ที่ไม่เกี่ยวข้องด้วย)
 */
export function useTimelineLabels(soilNodes) {
  return useMemo(() => {
    const timestampSet = new Set();
    Object.values(soilNodes).forEach((node) => node.timestamps.forEach((t) => timestampSet.add(t)));
    return [...timestampSet].sort();
  }, [soilNodes]);
}
