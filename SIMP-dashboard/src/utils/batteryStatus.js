/** อนุมานสถานะแบตเตอรี่จาก % — เกณฑ์เดียวกับไฟล์เดิม (60/30) */
export function batteryStatus(percent) {
  const pct = percent ?? 50;
  if (pct >= 60) return { level: 'ok', label: 'ONLINE', color: '#10b981' };
  if (pct >= 30) return { level: 'warn', label: 'LOW POWER', color: '#f59e0b' };
  return { level: 'critical', label: 'CRITICAL', color: '#ef4444' };
}

/** วันคงเหลือโดยประมาณ (heuristic เดียวกับไฟล์เดิม: pct * 0.3 วัน) */
export function estimatedDaysRemaining(percent) {
  return Math.round((percent ?? 50) * 0.3);
}
