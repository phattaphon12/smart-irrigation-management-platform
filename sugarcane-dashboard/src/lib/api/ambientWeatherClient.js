/**
 * Ambient Weather API client (§4.1)
 *
 * ⚠️ คำเตือนด้านความปลอดภัย: โค้ดนี้เรียก API ตรงจาก browser เพื่อความง่ายในการ demo
 * แต่จะ expose apiKey/applicationKey ให้ผู้ใช้เห็นใน network tab ได้ ก่อนขึ้น production
 * ควรทำ backend/serverless proxy เก็บ key ไว้ฝั่ง server แล้วให้ frontend เรียก proxy แทน
 *
 * กติกาสำคัญจากเอกสาร:
 *  - rate limit 1 request/วินาที -> ใส่ delay อย่างน้อย 1.3 วินาทีระหว่าง request และจัดการ HTTP 429
 *  - endDate ที่มากกว่า lastData.dateutc จะคืน 0 records โดยไม่ error -> ต้องดึง lastData.dateutc ก่อนเสมอ
 *  - ได้ records น้อยกว่า limit ไม่ได้แปลว่าหมดข้อมูล -> jump-back 1 วันแล้วดึงต่อ, หยุดเมื่อว่างติดกัน ~30 วัน
 */

const BASE_URL = 'https://rt.ambientweather.net/v1';
const REQUEST_DELAY_MS = 1300;
const MAX_LIMIT = 288; // ที่ resolution 1 นาที = 4.8 ชม./request
const EMPTY_STREAK_STOP_DAYS = 30;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAuthQuery(apiKey, applicationKey) {
  return `apiKey=${encodeURIComponent(apiKey)}&applicationKey=${encodeURIComponent(applicationKey)}`;
}

async function fetchWithRetry(url, { maxRetries = 5 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const res = await fetch(url);
    if (res.status === 429) {
      // rate-limited: คอยตาม exponential backoff แล้วลองใหม่
      await sleep(REQUEST_DELAY_MS * 2 ** attempt);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Ambient Weather API error: HTTP ${res.status}`);
    }
    return res.json();
  }
  throw new Error('Ambient Weather API: exceeded max retries after repeated HTTP 429');
}

/**
 * ดึงข้อมูลล่าสุดของสถานี (ใช้หา lastData.dateutc ก่อนดึงข้อมูลย้อนหลัง)
 */
export async function fetchLatestDeviceData({ apiKey, applicationKey }) {
  const url = `${BASE_URL}/devices?${buildAuthQuery(apiKey, applicationKey)}`;
  const devices = await fetchWithRetry(url);
  return devices?.[0] ?? null; // { macAddress, lastData: {...} }
}

/**
 * ดึงข้อมูลย้อนหลังของสถานีหนึ่งช่วง (สูงสุด limit records, เรียงใหม่ -> เก่า)
 */
export async function fetchHistoricalChunk({ apiKey, applicationKey, mac, endDateMs, limit = MAX_LIMIT }) {
  const url = `${BASE_URL}/devices/${mac}?endDate=${endDateMs}&limit=${limit}&${buildAuthQuery(apiKey, applicationKey)}`;
  return fetchWithRetry(url);
}

/**
 * ดึงข้อมูลย้อนหลังทั้งหมดตั้งแต่ lastData.dateutc ถอยไปจนถึง sinceDate โดยจัดการ:
 *  - rate limit (delay ระหว่าง request)
 *  - ช่วงว่างที่สถานี offline (jump-back 1 วัน, หยุดเมื่อว่างติดกัน ~30 วัน)
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.applicationKey
 * @param {string} opts.mac
 * @param {Date} opts.sinceDate - ดึงย้อนไปจนถึงวันที่นี้
 * @param {(progress: {records: number, oldestDate: Date}) => void} [opts.onProgress]
 * @returns {Promise<Array>} ข้อมูลดิบ 1 นาที เรียงจากเก่า -> ใหม่
 */
export async function fetchAllHistorical({ apiKey, applicationKey, mac, sinceDate, onProgress }) {
  const latest = await fetchLatestDeviceData({ apiKey, applicationKey });
  if (!latest?.lastData?.dateutc) {
    throw new Error('ไม่พบ lastData.dateutc จากสถานี — ตรวจสอบ apiKey/applicationKey/mac');
  }

  let cursor = latest.lastData.dateutc; // ms epoch, เริ่มจาก "ใหม่สุด" แล้วถอยหลัง
  const collected = [];
  let emptyStreakDays = 0;

  while (cursor > sinceDate.getTime() && emptyStreakDays < EMPTY_STREAK_STOP_DAYS) {
    await sleep(REQUEST_DELAY_MS);
    const chunk = await fetchHistoricalChunk({ apiKey, applicationKey, mac, endDateMs: cursor });

    if (!chunk || chunk.length === 0) {
      // ไม่มี error แต่ไม่มี record: อาจเป็นช่วง offline -> jump-back 1 วัน
      cursor -= 86400000;
      emptyStreakDays += 1;
      continue;
    }

    emptyStreakDays = 0;
    collected.push(...chunk);
    const oldestInChunk = chunk[chunk.length - 1].dateutc;
    cursor = oldestInChunk - 1; // ถอยต่อจากจุดที่เก่าที่สุดใน chunk นี้

    onProgress?.({ records: collected.length, oldestDate: new Date(oldestInChunk) });
  }

  return collected.filter((r) => r.dateutc >= sinceDate.getTime()).sort((a, b) => a.dateutc - b.dateutc);
}
