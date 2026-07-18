import { useEffect, useState } from 'react';
import { SOIL_NODES_MOCK } from '../data/mockSoilNodes';
import { fetchSoilNodeSeries } from '../lib/api/soilNodeClient';

const SOIL_API_BASE_URL = import.meta.env.VITE_SOIL_API_BASE_URL || '';

/**
 * ข้อมูลโหนดเซนเซอร์ความชื้นดิน — ใช้ mock เป็นค่าเริ่มต้นเสมอ (pipeline A ยังไม่มี endpoint
 * กลางตามเอกสารอ้างอิง) แต่ถ้าตั้ง VITE_SOIL_API_BASE_URL ไว้ จะลองดึงจริงและ fallback กลับ mock
 * หากล้มเหลว เพื่อไม่ให้ dashboard พังตอน backend ยังไม่พร้อม
 */
export function useSoilNodesData() {
  const [nodes, setNodes] = useState(SOIL_NODES_MOCK);
  const [source, setSource] = useState('mock');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!SOIL_API_BASE_URL) return;

    let cancelled = false;
    (async () => {
      try {
        const live = await fetchSoilNodeSeries({
          baseUrl: SOIL_API_BASE_URL,
          since: new Date(Date.now() - 365 * 86400000),
          until: new Date(),
        });
        if (!cancelled && live) {
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
