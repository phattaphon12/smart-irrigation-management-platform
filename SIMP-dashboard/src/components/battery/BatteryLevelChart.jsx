import { useState } from 'react';
import { CHART_WIDTH, MARGIN_LEFT, PLOT_WIDTH } from '../../constants/chartLayout';
import { colorForNodeIndex, nodeIndexFromId } from '../../utils/nodeColors';
import { batteryStatus } from '../../utils/batteryStatus';
import ChartTooltip from '../charts/ChartTooltip';

const MT = 20;
const BAR_AREA_H = 180;
const H = 260;

export default function BatteryLevelChart({ nodeIds, soilNodes }) {
  const [hover, setHover] = useState(null);
  const barGroupW = PLOT_WIDTH / nodeIds.length;
  const innerBarW = barGroupW * 0.55;

  const handleMove = (e, nodeId) => {
    const rect = e.currentTarget.closest('.cc').getBoundingClientRect();
    setHover({ nodeId, mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top });
  };

  const hoverMeta = hover ? soilNodes[hover.nodeId].meta : null;

  return (
    <div className="cc" style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CHART_WIDTH} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <rect x={MARGIN_LEFT} y={MT} width={PLOT_WIDTH} height={BAR_AREA_H} fill="#ffffff" />

        {[0, 1, 2, 3, 4].map((i) => {
          const pctVal = i * 25;
          const yy = MT + BAR_AREA_H * (1 - pctVal / 100);
          return (
            <g key={i}>
              <line x1={MARGIN_LEFT} y1={yy} x2={MARGIN_LEFT + PLOT_WIDTH} y2={yy} stroke="#e2e8f0" strokeWidth="1" />
              <text x={MARGIN_LEFT - 12} y={yy + 4} fill="#64748b" fontSize="11" fontWeight="500" textAnchor="end">{pctVal}%</text>
            </g>
          );
        })}

        {nodeIds.map((nodeId, idx) => {
          const pct = soilNodes[nodeId].meta.battery || 50;
          const xx = MARGIN_LEFT + barGroupW * idx + (barGroupW - innerBarW) / 2;
          const yy = MT + BAR_AREA_H * (1 - pct / 100);
          const barH = MT + BAR_AREA_H - yy;
          const fillColor = batteryStatus(pct).color;
          return (
            <g key={nodeId}>
              <rect x={xx} y={yy} width={innerBarW} height={barH} fill={fillColor} rx="2" opacity="0.85" />
              <text
                x={xx + innerBarW / 2}
                y="212"
                fill="#475569"
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                transform={`rotate(-40, ${xx + innerBarW / 2}, 212)`}
              >
                {soilNodes[nodeId].meta.name || nodeId}
              </text>
              <rect
                x={MARGIN_LEFT + barGroupW * idx}
                y={MT}
                width={barGroupW}
                height={BAR_AREA_H}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseMove={(e) => handleMove(e, nodeId)}
              />
            </g>
          );
        })}

        <rect x={MARGIN_LEFT} y={MT} width={PLOT_WIDTH} height={BAR_AREA_H} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
      </svg>

      <ChartTooltip
        visible={!!hover}
        x={hover?.mouseX ?? 0}
        y={hover?.mouseY ?? 0}
        title={hover ? (hoverMeta.name || hover.nodeId) : ''}
        lines={
          hoverMeta
            ? [
                { color: colorForNodeIndex(nodeIndexFromId(hover.nodeId)), label: 'Treatment', value: hoverMeta.treatment },
                { color: '#475569', label: 'Depth', value: `${hoverMeta.depth} cm` },
                { color: batteryStatus(hoverMeta.battery).color, label: 'Battery', value: `${hoverMeta.battery}%` },
              ]
            : []
        }
      />
    </div>
  );
}
