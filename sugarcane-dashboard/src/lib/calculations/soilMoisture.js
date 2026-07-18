/**
 * Pipeline A — เซนเซอร์ความชื้นดิน (Watermark 200SS + ESP32-H2)
 * ADC (12-bit) → R (kΩ) → kPa → VWC → %AWC
 * อ้างอิง §3 ของเอกสาร dev_reference_sensor_et_v1.md
 *
 * จุดที่ผิดพลาดบ่อยที่สุด (ดู §3.2, §6.1):
 *   คำนวณ kPa ต้องหารด้วย "ตัวส่วนทั้งหมด" ของสมการ Shock & Seddigh
 *   ไม่ใช่ใช้แค่ตัวเศษ (-3.213·R - 4.093) เฉยๆ ซึ่งจะทำให้ค่าดู "แห้งน้อยกว่าจริง"
 */
import { SENSOR_CONSTANTS, ADC_MAX } from '../../constants/sensorConstants';
import { VAN_GENUCHTEN, VG_M, WILTING_POINT_VWC, AVAILABLE_WATER_CAPACITY } from '../../constants/vanGenuchten';

/** ขั้นที่ 1 — ADC เป็นความต้านทาน R (kΩ) */
export function adcToResistanceKohm(adc) {
  const { rDividerOhm } = SENSOR_CONSTANTS;
  return (rDividerOhm / 1000) * (ADC_MAX / adc - 1);
}

/**
 * ขั้นที่ 2 — ความต้านทานเป็น kPa ตาม Shock & Seddigh (1998), แทนอุณหภูมิดินคงที่แล้ว
 * ตัวส่วน (1 - d*T) มาจาก 1 − 0.01205 × T โดย T = assumedSoilTempC (ปกติ 24°C → 0.7108)
 */
export function resistanceToKpa(rKohm) {
  const { a, b, c, d } = SENSOR_CONSTANTS.shockSeddigh;
  const denominator = 1 - d * SENSOR_CONSTANTS.assumedSoilTempC - c * rKohm; // = 0.7108 - 0.009733*R เมื่อ T=24
  const rawKpa = (a * rKohm + b) / denominator;
  return Math.max(rawKpa, SENSOR_CONSTANTS.kpaClipMin); // clip ที่ -200
}

/** ขั้นที่ 3 — kPa เป็น VWC ตาม Van Genuchten (1980) */
export function kpaToVwc(kpa) {
  const { thetaR, thetaS, alpha, n } = VAN_GENUCHTEN;
  return thetaR + (thetaS - thetaR) / (1 + (alpha * Math.abs(kpa)) ** n) ** VG_M;
}

/** ขั้นที่ 4 — VWC เป็น %AWC */
export function vwcToPercentAwc(vwc) {
  return ((vwc - WILTING_POINT_VWC) / AVAILABLE_WATER_CAPACITY) * 100;
}

/**
 * แปลง raw ADC (0-4095) เป็น {kPa, vwc, percentAwc} ครบทั้ง 4 ขั้น
 * คืนค่า null ทั้งหมดหาก ADC อยู่นอกช่วงที่ใช้ได้ (open circuit)
 */
export function adcToAll(adc) {
  if (adc == null || adc <= SENSOR_CONSTANTS.adcValidMin) {
    return { kpa: null, vwc: null, percentAwc: null };
  }
  const rKohm = adcToResistanceKohm(adc);
  const kpa = resistanceToKpa(rKohm);
  const vwc = kpaToVwc(kpa);
  const percentAwc = vwcToPercentAwc(vwc);
  return { kpa, vwc, percentAwc };
}
