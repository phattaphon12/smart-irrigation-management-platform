import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_EXCLUDED = 'Node_030'; // spare node — ไม่ active ตามเอกสาร §5

function defaultSelection(nodeIds) {
  const initial = new Set(nodeIds.slice(0, 6));
  initial.delete(DEFAULT_EXCLUDED);
  return initial;
}

/**
 * จัดการ node ที่ถูกเลือก (active set) + view mode (kpa/vwc/awc)
 * พอร์ตจาก state `act` และ `viewMode` ในไฟล์เดิม
 */
export function useNodeSelection(soilNodes) {
  const nodeIds = useMemo(() => Object.keys(soilNodes).sort(), [soilNodes]);

  const [activeNodes, setActiveNodes] = useState(() => defaultSelection(nodeIds));
  const [viewMode, setViewMode] = useState('kpa'); // 'kpa' | 'vwc' | 'awc'

  // soilNodes starts out as placeholder mock data and later swaps to live DB
  // data once the fetch resolves. The two use unrelated id formats
  // ("Node_001" vs "Node_01"), so without this the selection made against the
  // mock set would carry over empty against the real one — every node would
  // silently end up deselected the moment live data arrives.
  const nodeIdsKey = nodeIds.join(',');
  const prevNodeIdsKey = useRef(nodeIdsKey);
  useEffect(() => {
    if (prevNodeIdsKey.current === nodeIdsKey) return;
    prevNodeIdsKey.current = nodeIdsKey;
    setActiveNodes((prev) => {
      const stillValid = nodeIds.filter((id) => prev.has(id));
      return stillValid.length > 0 ? new Set(stillValid) : defaultSelection(nodeIds);
    });
  }, [nodeIdsKey, nodeIds]);

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
