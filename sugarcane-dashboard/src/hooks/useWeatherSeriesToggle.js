import { useState } from 'react';

/** พอร์ตจาก state `wS` (eto/etc/rain toggle) และ `cumM` (cumulative toggle) ในไฟล์เดิม */
export function useWeatherSeriesToggle() {
  const [seriesOn, setSeriesOn] = useState({ eto: true, etc: true, rain: true });
  const [cumulative, setCumulative] = useState(false);

  const toggleSeries = (key) => setSeriesOn((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleCumulative = () => setCumulative((prev) => !prev);

  return { seriesOn, toggleSeries, cumulative, toggleCumulative };
}
