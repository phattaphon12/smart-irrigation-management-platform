import { useEffect, useState } from 'react';
import { WEATHER_SUMMARY_MOCK } from '../data/mockWeatherSummary';
import { WATER_BALANCE_MOCK } from '../data/mockWaterBalance';
import { fetchWeatherHistory, fetchWeatherProgress } from '../lib/api/ambientWeatherClient';
import { fetchCropConfig } from '../lib/api/cropConfigClient';
import { aggregateDaily } from '../lib/api/dailyAggregation';
import { calculateETo } from '../lib/calculations/evapotranspiration';
import { calculateEtc, daysAfterPlanting } from '../lib/calculations/cropWaterUse';

const USE_LIVE_WEATHER = import.meta.env.VITE_USE_LIVE_WEATHER === 'true';

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
function buildWeatherSummaryFromDaily(dailyRecords, cropConfig) {
  const qcDays = dailyRecords.filter((d) => d.qcPass); // QC: รับเฉพาะวันที่ n_records >= 1000 (§4.3)

  const eto = [];
  const etc = [];
  const rain = [];
  const timestamps = [];

  qcDays.forEach((day) => {
    const { eto: etoVal } = calculateETo(day);
    const dap = daysAfterPlanting(day.date, cropConfig.plantingDate);
    const { etc: etcVal } = calculateEtc(etoVal, dap, cropConfig.cropType);
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
 * เปิด live ได้ด้วย VITE_USE_LIVE_WEATHER=true — apiKey/applicationKey/station MAC ตั้งค่าที่
 * sugarcane-backend (.env หรือหน้า Settings ในแอป) ไม่ใช่ที่ frontend .env อีกต่อไป
 * ข้อมูลจะดึงผ่าน backend proxy แล้วคำนวณผ่าน src/lib/calculations (ตรง checkpoint §4.6 แล้ว)
 */
export function useWeatherData() {
  const [summary, setSummary] = useState(WEATHER_SUMMARY_MOCK);
  const [waterBalance] = useState(WATER_BALANCE_MOCK); // water balance (ΔStorage) ต้องมาจาก sensor/lab data — ยังไม่มีสูตร derive จาก weather ล้วนๆ
  const [source, setSource] = useState('mock');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null); // { recordsFetched, startedAt } | null while loading

  useEffect(() => {
    if (!USE_LIVE_WEATHER) return;

    const controller = new AbortController();
    setLoading(true);
    setProgress(null);

    // records-fetched-so-far poll — cold cache can take ~30min for 304 days, so a
    // bare spinner with no feedback would look frozen/broken over that long a wait
    const pollId = setInterval(() => {
      fetchWeatherProgress()
        .then((p) => setProgress(p.active ? p : null))
        .catch(() => {});
    }, 2000);

    (async () => {
      try {
        const [raw, cropConfig] = await Promise.all([
          fetchWeatherHistory(304, controller.signal), // ~ฤดูกาลอ้างอิง 304 วัน
          fetchCropConfig().catch(() => ({ plantingDate: undefined, cropType: 'plantCrop' })), // fall back to cropWaterUse.js's own default reference date if the config endpoint is unreachable
        ]);
        const daily = aggregateDaily(raw);
        const built = buildWeatherSummaryFromDaily(daily, cropConfig);
        setSummary(built);
        setSource('live');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setSource('mock'); // fallback
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setProgress(null);
        }
      }
    })();

    return () => {
      controller.abort();
      clearInterval(pollId);
    };
  }, []);

  return { summary, waterBalance, source, loading, progress, error };
}
