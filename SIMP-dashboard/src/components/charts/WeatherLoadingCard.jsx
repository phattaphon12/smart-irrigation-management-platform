import { useEffect, useState } from 'react';

function elapsedLabel(startedAt) {
  if (!startedAt) return null;
  const secs = Math.round((Date.now() - startedAt) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m} นาที ${s} วิ` : `${s} วิ`;
}

export default function WeatherLoadingCard({ progress }) {
  // re-render every second purely to keep the elapsed-time counter ticking
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="chart-card">
      <div className="chart-hd">
        <div>
          <div className="chart-ttl">Water Use & Rainfall (mm/day)</div>
          <div className="chart-sub">Daily data from the plot's automatic weather station</div>
        </div>
      </div>
      <div className="weather-loading">
        <div className="spinner" />
        <div className="weather-loading-title">กำลังดึงข้อมูลสภาพอากาศจากสถานี…</div>
        <div className="weather-loading-detail">
          {progress?.recordsFetched
            ? `ดึงแล้ว ${progress.recordsFetched.toLocaleString()} records`
            : 'กำลังเชื่อมต่อสถานี…'}
          {progress?.startedAt && ` · ${elapsedLabel(progress.startedAt)}`}
        </div>
        <div className="weather-loading-hint">
          การโหลดครั้งแรกอาจใช้เวลาถึง ~30 นาที (ข้อมูลย้อนหลัง 304 วัน) — ครั้งถัดไปจะเร็วขึ้นมากเพราะมี cache ไว้แล้ว
        </div>
      </div>
    </div>
  );
}
