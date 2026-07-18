/**
 * Pipeline A (โหนดเซนเซอร์ความชื้นดิน ESP32-H2) — เอกสารอ้างอิงยังไม่ได้ระบุ API กลาง
 * (ระบุแค่ ADC -> resistance -> kPa -> VWC -> %AWC ที่ทำงานระดับ node ทุก 15 นาที)
 *
 * ไฟล์นี้เป็น "ช่องเสียบ" (adapter) ที่ทีม backend เติม endpoint จริงได้ทีหลัง โดยไม่ต้องแก้
 * ส่วน UI/hooks เลย — แค่แก้ฟังก์ชัน fetchSoilNodeSeries ให้ยิงไป backend จริง แล้ว map ให้ตรง shape
 *
 * shape ที่คาดหวัง สำหรับแต่ละ node:
 * {
 *   nodeId: 'Node_001',
 *   timestamps: ['2025-04-05', ...],
 *   readings: [{ adc: 2646 }, ...],   // หรือส่ง kpa/vwc/awc มาสำเร็จรูปก็ได้
 *   meta: { depth: 20, treatment: 'T1', position: '', status: 'OK', flagged: false, battery: 87 }
 * }
 */
import { adcToAll } from '../calculations/soilMoisture';

// eslint-disable-next-line no-unused-vars
export async function fetchSoilNodeSeries({ baseUrl, since, until }) {
  if (!baseUrl) {
    throw new Error(
      'VITE_SOIL_API_BASE_URL ยังไม่ถูกตั้งค่า — ยังไม่มี endpoint กลางสำหรับ pipeline A ตามเอกสารอ้างอิง ' +
        'ใช้ src/data/mockSoilNodes.js ไปก่อน หรือเติม endpoint จริงที่นี่'
    );
  }

  const res = await fetch(`${baseUrl}/soil-nodes?since=${since.toISOString()}&until=${until.toISOString()}`);
  if (!res.ok) throw new Error(`Soil node API error: HTTP ${res.status}`);
  const raw = await res.json();

  // ตัวอย่าง mapping หาก backend ส่ง raw ADC มา ให้แปลงด้วย adcToAll ที่นี่ (จุดเดียว, ใช้ค่าคงที่ชุดเดียวกันทั้งระบบ)
  return raw.map((node) => ({
    ...node,
    readings: node.readings.map((r) => (r.adc != null ? adcToAll(r.adc) : r)),
  }));
}
