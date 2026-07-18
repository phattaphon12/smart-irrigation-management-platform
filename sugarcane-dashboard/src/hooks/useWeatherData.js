import { useEffect, useState } from 'react';
import { WEATHER_SUMMARY_MOCK } from '../data/mockWeatherSummary';
import { WATER_BALANCE_MOCK } from '../data/mockWaterBalance';
import { fetchAllHistorical } from '../lib/api/ambientWeatherClient';
import { aggregateDaily } from '../lib/api/dailyAggregation';
import { calculateETo } from '../lib/calculations/evapotranspiration';
import { calculateEtc, daysAfterPlanting } from '../lib/calculations/cropWaterUse';

const USE_LIVE_WEATHER = import.meta.env.VITE_USE_LIVE_WEATHER === 'true';
const AMBIENT_API_KEY = import.meta.env.VITE_AMBIENT_API_KEY;
const AMBIENT_APPLICATION_KEY = import.meta.env.VITE_AMBIENT_APPLICATION_KEY;
const AMBIENT_STATION_MAC = import.meta.env.VITE_AMBIENT_STATION_MAC;

function cumulativeSum(values) {
  let running = 0;
  return values.map((v) => {
    running += v ?? 0;
    return running;
  });
}

/**
 * รวม daily ETo/ETc/rain จากข้อมูล FAO-56 ที่คำนวณเองเป็นโครงสร้างเดียวกับ WEATHER_SUMMARY_MOCK
 * (timestamps, eto, etc, rain, cum_eto, cum_etc, cum_rain) เพื่อให้ chart component ใช้ shape เดียวกัน
 * ไม่ต้องแยก branch mock/live
 */
function buildWeatherSummaryFromDaily(dailyRecords) {
  const qcDays = dailyRecords.filter((d) => d.qcPass); // QC: รับเฉพาะวันที่ n_records >= 1000 (§4.3)

  const eto = [];
  const etc = [];
  const rain = [];
  const timestamps = [];

  qcDays.forEach((day) => {
    const { eto: etoVal } = calculateETo(day);
    const dap = daysAfterPlanting(day.date);
    const { etc: etcVal } = calculateEtc(etoVal, dap, 'plantCrop');
    timestamps.push(day.dayKey);
    eto.push(Number(etoVal.toFixed(2)));
    etc.push(Number(etcVal.toFixed(2)));
    rain.push(Number(day.rain.toFixed(2)));
  });

  return {
    timestamps,
    eto,
    etc,
    rain,
    cum_eto: cumulativeSum(eto),
    cum_etc: cumulativeSum(etc),
    cum_rain: cumulativeSum(rain),
  };
}

/**
 * ข้อมูล ETo/ETc/rain — ค่าเริ่มต้นคือ mock (สำหรับพัฒนา UI เร็วๆ)
 * เปิด live ได้ด้วย VITE_USE_LIVE_WEATHER=true (+ ใส่ apiKey/applicationKey ใน .env)
 * ซึ่งจะดึงจาก Ambient Weather API แล้วคำนวณผ่าน src/lib/calculations (ตรง checkpoint §4.6 แล้ว)
 */
export function useWeatherData() {
  const [summary, setSummary] = useState(WEATHER_SUMMARY_MOCK);
  const [waterBalance] = useState(WATER_BALANCE_MOCK); // water balance (ΔStorage) ต้องมาจาก sensor/lab data — ยังไม่มีสูตร derive จาก weather ล้วนๆ
  const [source, setSource] = useState('mock');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!USE_LIVE_WEATHER) return;
    if (!AMBIENT_API_KEY || !AMBIENT_APPLICATION_KEY || !AMBIENT_STATION_MAC) {
      setError('VITE_USE_LIVE_WEATHER=true แต่ยังไม่ได้ตั้ง apiKey/applicationKey/mac ใน .env — ใช้ข้อมูล mock แทน');
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const sinceDate = new Date(Date.now() - 304 * 86400000); // ~ฤดูกาลอ้างอิง 304 วัน
        const raw = await fetchAllHistorical({
          apiKey: AMBIENT_API_KEY,
          applicationKey: AMBIENT_APPLICATION_KEY,
          mac: AMBIENT_STATION_MAC,
          sinceDate,
        });
        const daily = aggregateDaily(raw);
        const built = buildWeatherSummaryFromDaily(daily);
        if (!cancelled) {
          setSummary(built);
          setSource('live');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setSource('mock'); // fallback
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { summary, waterBalance, source, loading, error };
}
