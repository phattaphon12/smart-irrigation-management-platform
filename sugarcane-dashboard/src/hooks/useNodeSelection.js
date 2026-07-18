import { useMemo, useState } from 'react';

const DEFAULT_EXCLUDED = 'Node_030'; // spare node — ไม่ active ตามเอกสาร §5

/**
 * จัดการ node ที่ถูกเลือก (active set) + view mode (kpa/vwc/awc)
 * พอร์ตจาก state `act` และ `viewMode` ในไฟล์เดิม
 */
export function useNodeSelection(soilNodes) {
  const nodeIds = useMemo(() => Object.keys(soilNodes).sort(), [soilNodes]);

  const [activeNodes, setActiveNodes] = useState(() => {
    const initial = new Set(nodeIds.slice(0, 6));
    initial.delete(DEFAULT_EXCLUDED);
    return initial;
  });
  const [viewMode, setViewMode] = useState('kpa'); // 'kpa' | 'vwc' | 'awc'

  const toggleNode = (nodeId) => {
    setActiveNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const selectAll = () => setActiveNodes(new Set(nodeIds.filter((n) => n !== DEFAULT_EXCLUDED)));
  const selectNone = () => setActiveNodes(new Set());
  const selectByTreatment = (treatment) =>
    setActiveNodes(new Set(nodeIds.filter((n) => soilNodes[n].meta.treatment === treatment)));
  const selectByDepth = (depth) =>
    setActiveNodes(new Set(nodeIds.filter((n) => soilNodes[n].meta.depth === depth)));
  const selectOk = () =>
    setActiveNodes(new Set(nodeIds.filter((n) => !soilNodes[n].meta.flagged && n !== DEFAULT_EXCLUDED)));
  const selectFlagged = () => setActiveNodes(new Set(nodeIds.filter((n) => soilNodes[n].meta.flagged)));

  return {
    nodeIds,
    activeNodes,
    viewMode,
    setViewMode,
    toggleNode,
    selectAll,
    selectNone,
    selectByTreatment,
    selectByDepth,
    selectOk,
    selectFlagged,
  };
}
