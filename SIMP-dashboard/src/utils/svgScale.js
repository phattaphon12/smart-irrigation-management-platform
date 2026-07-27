/**
 * ตัวช่วยแปลงพิกัดข้อมูล -> พิกัด SVG (แนวคิดเดียวกับ xP()/sToY() ในไฟล์เดิม)
 */

/** ตำแหน่ง x ตาม index บนแกนเวลาที่มีจุดกระจายเท่ากัน (evenly spaced) */
export function xForIndex(index, count, marginLeft, plotWidth) {
  if (count <= 1) return marginLeft;
  return marginLeft + (plotWidth * index) / (count - 1);
}

/** ตำแหน่ง y ของค่า v ในช่วง [yMin, yMax], แกน y กลับหัว (SVG y ลงล่าง) */
export function yForValue(value, yMin, yMax, marginTop, plotHeight) {
  return marginTop + plotHeight * (1 - (value - yMin) / (yMax - yMin));
}

/** ปัดขอบบน/ล่างของสเกลแกน y ให้เป็นตัวเลขกลมๆ ตาม step ที่กำหนด */
export function niceBounds(values, step, pad = 0) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return { min: 0, max: step };
  const min = Math.floor((Math.min(...finite) - pad) / step) * step;
  const max = Math.ceil((Math.max(...finite) + pad) / step) * step;
  return { min, max };
}
