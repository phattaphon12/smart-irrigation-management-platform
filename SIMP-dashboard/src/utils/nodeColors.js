/** ชุดสีสำหรับแยกโหนดในกราฟ/legend — port จากไฟล์เดิม (var CL) */
export const NODE_COLORS = [
  '#0284c7', '#ef4444', '#16a34a', '#ea580c', '#7c3aed', '#db2777', '#0d9488', '#b45309',
  '#0f766e', '#991b1b', '#166534', '#c2410c', '#5b21b6', '#9d174d', '#115e59', '#1e3a8a',
  '#78350f', '#14532d', '#7f1d1d', '#3730a3', '#4b5563', '#0f172a', '#7c2d12', '#164e63',
  '#4c1d95', '#701a75', '#1e293b', '#7c2f12', '#134e4a', '#311042',
];

export function colorForNodeIndex(index) {
  return NODE_COLORS[index % NODE_COLORS.length];
}

/**
 * Stable color-index derived from the node's own id (e.g. "Node_010" -> 9), not its
 * position in whatever array it's currently in. Needed anywhere a node can appear in a
 * filtered/re-sorted list (e.g. Battery Status) — using array position there would make
 * the same node show a different color than it does on the Graph Dashboard.
 */
export function nodeIndexFromId(nodeId) {
  const n = parseInt(nodeId.split('_')[1], 10);
  return Number.isNaN(n) ? 0 : n - 1;
}
