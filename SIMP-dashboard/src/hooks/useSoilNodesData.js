import { useEffect, useState } from 'react';
import { SOIL_NODES_MOCK } from '../data/mockSoilNodes';
import { fetchSoilNodes } from '../lib/api/soilNodeClient';

const POLL_MS = 60000; // field nodes report roughly once a minute — match that cadence

/**
 * ข้อมูลโหนดเซนเซอร์ความชื้นดิน — เริ่มด้วย mock (ให้ UI ใช้งานได้ทันทีระหว่างรอ fetch) แล้วลอง
 * ดึงจริงจาก backend (simp-database) เสมอ ถ้าสำเร็จค่อยสลับไปใช้ข้อมูลจริง ถ้า backend/DB ไม่พร้อม
 * ก็ fallback ค้างที่ mock พร้อม error message แทนที่จะทำให้ dashboard พัง
 *
 * Polls every POLL_MS so newly-ingested readings show up without a manual
 * page reload. A failed poll (network blip, backend restart) keeps showing
 * the last-known-good data instead of flashing back to mock/error — only
 * the very first load falls back to mock on failure.
 */
export function useSoilNodesData() {
  const [nodes, setNodes] = useState(SOIL_NODES_MOCK);
  const [source, setSource] = useState('mock');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (isInitial) => {
      try {
        const live = await fetchSoilNodes();
        if (!cancelled && live && Object.keys(live).length > 0) {
          setNodes(live);
          setSource('live');
          if (isInitial) setError(null);
        }
      } catch (err) {
        if (!cancelled && isInitial) {
          setError(err.message);
          setSource('mock'); // fallback (initial load only)
        }
      }
    };

    load(true);
    const intervalId = setInterval(() => load(false), POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return { nodes, source, error };
}
