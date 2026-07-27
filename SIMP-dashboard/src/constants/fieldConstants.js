/**
 * พารามิเตอร์ของแปลง (§2.1 ของเอกสารอ้างอิง)
 * แก้ไขค่าเหล่านี้เมื่อย้ายแปลงหรือย้ายสถานีตรวจอากาศ
 */
export const FIELD_CONSTANTS = {
  /** Latitude (°N) — จาก Station GPS, ใช้คำนวณ Ra */
  latitude: 14.8437,
  /** Longitude (°E) — ใช้กำหนด timezone */
  longitude: 99.7946,
  /** Elevation (m) — จาก Survey, ใช้ใน P_atm และ Rso */
  elevation: 48,
  /** ความสูงติดตั้ง anemometer จริง (m) — ใช้ปรับความเร็วลมเป็น u2 */
  anemometerHeight: 2.7,
  /** Timezone offset (ICT) — ขอบเขตรายวันคือเที่ยงคืนเวลาไทย */
  timezoneOffsetHours: 7,
  /** วันปลูก plant crop — ใช้คำนวณ DAP สำหรับ Kc */
  plantingDate: '2025-01-10',
};
