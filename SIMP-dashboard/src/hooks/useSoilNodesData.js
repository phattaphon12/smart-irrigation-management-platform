import { useEffect, useState } from 'react';
import { fetchSoilNodes } from '../lib/api/soilNodeClient';

const POLL_MS = 60000; // dashboard refresh rate — field nodes themselves report every ~15 min (dev_reference_sensor_et_v1.md §1)

/**
 * ข้อมูลโหนดเซนเซอร์ความชื้นดิน — ดึงจาก backend (simp-database) เสมอ
 * ระหว่างรอ fetch แรก App.jsx จะโชว์ LoadingScreen แทน (ดู `loading`) แทนที่จะโชว์ข้อมูลปลอม
 *
 * Polls every POLL_MS so newly-ingested readings show up without a manual
 * page reload. A failed poll (network blip, backend restart) keeps showing
 * the last-known-good data instead of clearing it — only the very first
 * load attempt is reflected in `error`/`loading`.
 */
export function useSoilNodesData() {
  const [nodes, setNodes] = useState({});
  const [error, setError] = useState(null);
  // True only until the first fetch attempt settles (success or failure) — lets
  // the caller show a loading screen instead of an empty/broken dashboard.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async (isInitial) => {
      try {
        const live = await fetchSoilNodes();
        if (!cancelled && live && Object.keys(live).length > 0) {
          setNodes(live);
          if (isInitial) setError(null);
        }
      } catch (err) {
        if (!cancelled && isInitial) {
          setError(err.message);
        }
      } finally {
        if (!cancelled && isInitial) setLoading(false);
      }
    };

    load(true);
    const intervalId = setInterval(() => load(false), POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return { nodes, error, loading };
}
