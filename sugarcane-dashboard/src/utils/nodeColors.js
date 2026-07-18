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
