import { useEffect, useState } from 'react';
import { SOIL_NODES_MOCK } from '../data/mockSoilNodes';
import { fetchSoilNodes } from '../lib/api/soilNodeClient';

/**
 * ข้อมูลโหนดเซนเซอร์ความชื้นดิน — เริ่มด้วย mock (ให้ UI ใช้งานได้ทันทีระหว่างรอ fetch) แล้วลอง
 * ดึงจริงจาก backend (simp-database) เสมอ ถ้าสำเร็จค่อยสลับไปใช้ข้อมูลจริง ถ้า backend/DB ไม่พร้อม
 * ก็ fallback ค้างที่ mock พร้อม error message แทนที่จะทำให้ dashboard พัง
 */
export function useSoilNodesData() {
  const [nodes, setNodes] = useState(SOIL_NODES_MOCK);
  const [source, setSource] = useState('mock');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const live = await fetchSoilNodes();
        if (!cancelled && live && Object.keys(live).length > 0) {
          setNodes(live);
          setSource('live');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setSource('mock'); // fallback
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { nodes, source, error };
}
