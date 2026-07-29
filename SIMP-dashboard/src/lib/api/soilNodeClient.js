/**
 * Pipeline A (โหนดเซนเซอร์ความชื้นดิน) — เรียก backend ของเราเอง ซึ่งอ่านจาก simp-database
 * (Postgres: ตาราง nodes + node_log) แล้ว reshape เป็น { [nodeCode]: { timestamps, kpa, vwc, awc, meta } }
 * (kPa/VWC/%AWC คำนวณไว้ล่วงหน้าตอน migrate ข้อมูล ไม่ต้องแปลงจาก ADC ที่นี่อีก)
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function fetchSoilNodes() {
  const res = await fetch(`${BACKEND_URL}/api/soil-nodes`);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || `Backend error: HTTP ${res.status}`);
  }
  return body;
}
