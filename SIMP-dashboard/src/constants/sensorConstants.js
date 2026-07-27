/**
 * เซนเซอร์และฮาร์ดแวร์ (§2.2) — Watermark 200SS + ESP32-H2
 * ค่าที่สถานะ "ประมาณ" ควรทำเป็น config ที่แก้ไขได้ ไม่ hardcode ตายตัว
 */
export const SENSOR_CONSTANTS = {
  /** ตัวต้านทานแบ่งแรงดัน (Ω) — มาตรฐาน, firmware BoardConfig.h */
  rDividerOhm: 10000,
  /** แรงดันไฟเลี้ยง (V) — มาตรฐาน, ESP32-H2 */
  vcc: 3.3,
  /** ความละเอียด ADC (bit) — มาตรฐาน, ESP32-H2 */
  adcBits: 12,
  /** อุณหภูมิดินที่สมมติคงที่ (°C) — ประมาณ เนื่องจากไม่มี temperature sensor บน node */
  assumedSoilTempC: 24,
  /** สัมประสิทธิ์สมการ Shock & Seddigh (1998) — มาตรฐาน */
  shockSeddigh: {
    a: -3.213,
    b: -4.093,
    c: 0.009733,
    d: 0.01205,
  },
  /** ค่า clip ต่ำสุดของ kPa (วัดได้: ค่าต่ำกว่านี้มี 1.78% ของข้อมูล) */
  kpaClipMin: -200,
  /** ช่วง ADC ที่ใช้ได้ (วัดได้: ตัดค่า open-circuit; ข้อมูลจริง 675–3581) */
  adcValidMin: 10,
};

export const ADC_MAX = 2 ** SENSOR_CONSTANTS.adcBits - 1; // 4095 ที่ 12-bit
