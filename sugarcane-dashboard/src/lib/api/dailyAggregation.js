/**
 * รวมข้อมูลดิบ 1 นาทีจาก Ambient Weather API เป็นค่ารายวัน (§4.2, §4.3)
 * ขอบเขตวันคือเที่ยงคืนเวลาไทย (ICT, +7) ไม่ใช่ UTC
 */
import { FIELD_CONSTANTS } from '../../constants/fieldConstants';
import { rsTrapezoidal } from '../calculations/radiation';

const F_TO_C = (f) => ((f - 32) * 5) / 9;
const MPH_TO_MS = (mph) => mph * 0.44704;
const INHG_TO_KPA = (inHg) => inHg * 3.38639;
const IN_TO_MM = (inches) => inches * 25.4;

/** วันที่ (YYYY-MM-DD) ตามเวลาไทย จาก dateutc (ms epoch UTC) */
function toThaiDateKey(dateutcMs) {
  const shifted = new Date(dateutcMs + FIELD_CONSTANTS.timezoneOffsetHours * 3600000);
  return shifted.toISOString().slice(0, 10);
}

/** วินาทีนับจากเที่ยงคืนเวลาไทยของวันนั้น */
function secondsSinceThaiMidnight(dateutcMs) {
  const shifted = new Date(dateutcMs + FIELD_CONSTANTS.timezoneOffsetHours * 3600000);
  const h = shifted.getUTCHours();
  const m = shifted.getUTCMinutes();
  const s = shifted.getUTCSeconds();
  return h * 3600 + m * 60 + s;
}

const QC_MIN_RECORDS_PER_DAY = 1000;

/**
 * รวมข้อมูลดิบ 1 นาที (จาก ambientWeatherClient) เป็น array รายวัน
 * @param {Array} rawRecords - records จาก Ambient Weather API, field ตาม §4.2
 * @returns {Array<object>} รายวัน พร้อม flag qcPass (n_records >= 1000)
 */
export function aggregateDaily(rawRecords) {
  const byDay = new Map();

  for (const r of rawRecords) {
    const dayKey = toThaiDateKey(r.dateutc);
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, {
        dayKey,
        temps: [],
        rhs: [],
        dewPoints: [],
        winds: [],
        solarPoints: [],
        dailyRainIn: [],
        baroms: [],
        nRecords: 0,
      });
    }
    const bucket = byDay.get(dayKey);
    bucket.nRecords += 1;
    if (typeof r.tempf === 'number') bucket.temps.push(F_TO_C(r.tempf));
    if (typeof r.humidity === 'number') bucket.rhs.push(r.humidity);
    if (typeof r.dewPoint === 'number') bucket.dewPoints.push(F_TO_C(r.dewPoint));
    if (typeof r.windspeedmph === 'number') bucket.winds.push(MPH_TO_MS(r.windspeedmph));
    if (typeof r.solarradiation === 'number') {
      bucket.solarPoints.push([secondsSinceThaiMidnight(r.dateutc), r.solarradiation]);
    }
    if (typeof r.dailyrainin === 'number') bucket.dailyRainIn.push(r.dailyrainin);
    if (typeof r.baromrelin === 'number') bucket.baroms.push(INHG_TO_KPA(r.baromrelin));
  }

  const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;

  return [...byDay.values()]
    .sort((a, b) => (a.dayKey < b.dayKey ? -1 : 1))
    .map((bucket) => ({
      date: new Date(`${bucket.dayKey}T00:00:00+07:00`),
      dayKey: bucket.dayKey,
      tmax: Math.max(...bucket.temps),
      tmin: Math.min(...bucket.temps),
      rhMax: Math.max(...bucket.rhs),
      rhMin: Math.min(...bucket.rhs),
      tdewMean: mean(bucket.dewPoints),
      uz: mean(bucket.winds), // ปรับด้วย windFactor ตอนคำนวณ ETo (ไม่ใช่ที่นี่)
      rs: rsTrapezoidal(bucket.solarPoints), // MJ/m²/วัน — trapezoidal เท่านั้น ห้าม sum ตรงๆ
      rain: bucket.dailyRainIn.length ? IN_TO_MM(Math.max(...bucket.dailyRainIn)) : 0, // MAX ไม่ใช่ sum (ค่าสะสม reset เที่ยงคืน)
      pAtm: mean(bucket.baroms),
      nRecords: bucket.nRecords,
      qcPass: bucket.nRecords >= QC_MIN_RECORDS_PER_DAY, // รับเฉพาะวันที่ n_records >= 1000
    }));
}
