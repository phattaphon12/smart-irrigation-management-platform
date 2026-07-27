import { useMemo, useState } from 'react';
import {
  CHART_WIDTH,
  MARGIN_LEFT,
  MARGIN_TOP,
  MARGIN_BOTTOM,
  PLOT_WIDTH,
  SOIL_CHART_HEIGHT,
} from '../../constants/chartLayout';
import { xForIndex, yForValue } from '../../utils/svgScale';
import { colorForNodeIndex } from '../../utils/nodeColors';
import ChartTooltip from './ChartTooltip';

const VIEW_RANGES = {
  kpa: { yMin: -220, yMax: 10 },
  vwc: { yMin: 0.02, yMax: 0.45 },
  awc: { yMin: -10, yMax: 180 },
};

const KPA_ZONES = [
  { a: 0, b: -10, color: '#f8fafc' },
  { a: -10, b: -33, color: '#f0fdf4' },
  { a: -33, b: -60, color: '#fffbeb' },
  { a: -60, b: -100, color: '#fff7ed' },
  { a: -100, b: -220, color: '#fef2f2' },
];

const AWC_ZONES = [
  { a: 180, b: 100, color: '#f0fdf4' },
  { a: 100, b: 75, color: '#f8fafc' },
  { a: 75, b: 50, color: '#fffbeb' },
  { a: 50, b: 25, color: '#fff7ed' },
  { a: 25, b: 0, color: '#fef2f2' },
];

const AWC_LINES = [
  { v: 100, color: '#10b981', label: '100% FC' },
  { v: 75, color: '#d97706', label: '75%' },
  { v: 50, color: '#f97316', label: '50%' },
  { v: 25, color: '#ef4444', label: '25%' },
  { v: 0, color: '#64748b', label: '0% WP' },
];

const VIEW_LABEL = { kpa: 'kPa', vwc: 'VWC', awc: '%AWC' };
const VIEW_UNIT = { kpa: ' kPa', vwc: '', awc: ' %AWC' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Labels are "YYYY-MM-DD" (no time recorded) or "YYYY-MM-DDTHH:MM:SS" (soil node
// readings, several a day) — split on 'T' rather than going through Date/timezone
// parsing so the string's own wall-clock time is shown verbatim either way.
function splitLabel(label) {
  const [datePart, timePart] = label.split('T');
  return { datePart, timePart };
}

function formatAxisTick(label) {
  const { datePart, timePart } = splitLabel(label);
  const md = datePart.slice(5); // "MM-DD"
  return timePart ? `${md} ${timePart.slice(0, 5)}` : md;
}

function formatTooltipTitle(label) {
  const { datePart, timePart } = splitLabel(label);
  const [y, m, d] = datePart.split('-').map(Number);
  const dateStr = `${d} ${MONTHS[m - 1]} ${y}`;
  return timePart ? `${dateStr}, ${timePart.slice(0, 5)}` : dateStr;
}

const H = SOIL_CHART_HEIGHT + MARGIN_TOP + MARGIN_BOTTOM;

export default function SoilTensionChart({ labels, soilNodes, activeNodes, viewMode, nodeIds, controls }) {
  const [hover, setHover] = useState(null); // { idx, mouseX, mouseY }
  const { yMin, yMax } = VIEW_RANGES[viewMode];
  const nL = labels.length;
  const xStep = Math.max(1, Math.floor(nL / 12));
  const colW = nL > 1 ? PLOT_WIDTH / (nL - 1) : PLOT_WIDTH;

  const yToPx = (v) => yForValue(v, yMin, yMax, MARGIN_TOP, SOIL_CHART_HEIGHT);
  const xToPx = (i) => xForIndex(i, nL, MARGIN_LEFT, PLOT_WIDTH);

  const activeList = useMemo(
    () => nodeIds.map((id, index) => ({ id, index })).filter(({ id }) => activeNodes.has(id)),
    [nodeIds, activeNodes]
  );

  const lines = useMemo(() => {
    return activeList.map(({ id, index }) => {
      const node = soilNodes[id];
      const src = viewMode === 'kpa' ? node.kpa : viewMode === 'vwc' ? node.vwc : node.awc;
      const byDate = new Map(node.timestamps.map((t, j) => [t, src[j]]));
      const coords = [];
      labels.forEach((label, li) => {
        const raw = byDate.get(label);
        if (raw == null) return;
        const clipped = viewMode === 'kpa' ? Math.max(raw, yMin) : Math.min(Math.max(raw, yMin), yMax);
        coords.push({ x: xToPx(li), y: yToPx(clipped) });
      });
      return {
        id,
        index,
        coords,
        points: coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
        flagged: node.meta.flagged,
        byDate,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeList, soilNodes, viewMode, labels, yMin, yMax]);

  const gridTicks = useMemo(() => {
    const nT = 8;
    return Array.from({ length: nT + 1 }, (_, i) => {
      const val = yMin + ((yMax - yMin) * i) / nT;
      return { val, y: yToPx(val) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yMin, yMax]);

  const subtitle =
    activeList.length === 0
      ? 'No sensor nodes selected — pick some from the map on the left'
      : `Showing data from ${activeList.length} selected sensor node${activeList.length === 1 ? '' : 's'}`;

  const handleMove = (e, idx) => {
    const rect = e.currentTarget.closest('.cc').getBoundingClientRect();
    setHover({ idx, mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top, clientX: e.clientX, clientY: e.clientY });
  };

  const tooltipLines = useMemo(() => {
    if (!hover) return [];
    return lines
      .filter((l) => l.byDate.get(labels[hover.idx]) != null)
      .map((l) => ({
        color: colorForNodeIndex(l.index),
        label: l.id.replace('Node_', 'N'),
        value: `${l.byDate.get(labels[hover.idx]).toFixed(viewMode === 'vwc' ? 4 : 1)}${VIEW_UNIT[viewMode]}`,
      }));
  }, [hover, lines, labels, viewMode]);

  return (
    <div className="chart-card">
      <div className="chart-hd">
        <div>
          <div className="chart-ttl">{{ kpa: 'Soil Water Tension (kPa)', vwc: 'Soil Moisture Content (VWC)', awc: 'Available Water for Crop (%AWC)' }[viewMode]}</div>
          <div className="chart-sub">{subtitle}</div>
          <div className="chart-sub">
            {{
              kpa: 'The more negative, the drier the soil — consider irrigating below −60 kPa',
              vwc: 'Share of water per soil volume — compare against the Field Capacity and Wilting Point lines on the right',
              awc: 'Percent of water the crop can still draw on — the closer to 0%, the more urgent irrigation is',
            }[viewMode]}
          </div>
        </div>
        {controls}
      </div>
      <div className="cc" style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CHART_WIDTH} ${H}`} style={{ width: '100%', height: 'auto' }}>
          {/* background zone bands */}
          {viewMode === 'kpa' &&
            KPA_ZONES.map((z, i) => {
              const y1 = yToPx(Math.min(z.a, yMax));
              const y2 = yToPx(Math.max(z.b, yMin));
              const top = Math.max(y1, MARGIN_TOP);
              const bottom = Math.min(y2, MARGIN_TOP + SOIL_CHART_HEIGHT);
              if (bottom <= top) return null;
              return <rect key={i} x={MARGIN_LEFT} y={top} width={PLOT_WIDTH} height={bottom - top} fill={z.color} />;
            })}
          {viewMode === 'vwc' && (
            <>
              <line x1={MARGIN_LEFT} y1={yToPx(0.193)} x2={MARGIN_LEFT + PLOT_WIDTH} y2={yToPx(0.193)} stroke="#10b981" strokeWidth="1.5" strokeDasharray="6,4" />
              <text x={MARGIN_LEFT + PLOT_WIDTH + 8} y={yToPx(0.193) + 4} fill="#10b981" fontSize="11" fontWeight="600">Field Capacity (0.193)</text>
              <line x1={MARGIN_LEFT} y1={yToPx(0.0538)} x2={MARGIN_LEFT + PLOT_WIDTH} y2={yToPx(0.0538)} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,4" />
              <text x={MARGIN_LEFT + PLOT_WIDTH + 8} y={yToPx(0.0538) + 4} fill="#ef4444" fontSize="11" fontWeight="600">Wilting Point (0.054)</text>
            </>
          )}
          {viewMode === 'awc' && (
            <>
              {AWC_ZONES.map((z, i) => {
                const y1 = yToPx(z.a);
                const y2 = yToPx(z.b);
                if (y2 <= y1) return null;
                return <rect key={i} x={MARGIN_LEFT} y={y1} width={PLOT_WIDTH} height={y2 - y1} fill={z.color} opacity="0.8" />;
              })}
              {AWC_LINES.map((t) => (
                <g key={t.v}>
                  <line x1={MARGIN_LEFT} y1={yToPx(t.v)} x2={MARGIN_LEFT + PLOT_WIDTH} y2={yToPx(t.v)} stroke={t.color} strokeWidth="1" strokeDasharray="4,4" strokeOpacity="0.3" />
                  <text x={MARGIN_LEFT + PLOT_WIDTH + 8} y={yToPx(t.v) + 4} fill={t.color} fontSize="11" fontWeight="600">{t.label}</text>
                </g>
              ))}
            </>
          )}

          {/* horizontal gridlines + y-axis labels */}
          {gridTicks.map(({ val, y }, i) => (
            <g key={i}>
              <line x1={MARGIN_LEFT} y1={y} x2={MARGIN_LEFT + PLOT_WIDTH} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={MARGIN_LEFT - 12} y={y + 4} fill="#64748b" fontSize="11" fontWeight="500" textAnchor="end">
                {viewMode === 'vwc' ? val.toFixed(2) : Math.round(val)}
              </text>
            </g>
          ))}

          <text
            x="22"
            y={MARGIN_TOP + SOIL_CHART_HEIGHT / 2}
            fill="#1e293b"
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
            transform={`rotate(-90,22,${MARGIN_TOP + SOIL_CHART_HEIGHT / 2})`}
          >
            {VIEW_LABEL[viewMode]}
          </text>

          {/* vertical gridlines + x-axis date labels */}
          {Array.from({ length: Math.ceil(nL / xStep) }, (_, k) => k * xStep)
            .filter((i) => i < nL)
            .map((i) => (
              <g key={i}>
                <line x1={xToPx(i)} y1={MARGIN_TOP} x2={xToPx(i)} y2={MARGIN_TOP + SOIL_CHART_HEIGHT} stroke="#e2e8f0" />
                <text x={xToPx(i)} y={MARGIN_TOP + SOIL_CHART_HEIGHT + 22} fill="#64748b" fontSize="11" fontWeight="500" textAnchor="middle">
                  {labels[i] && formatAxisTick(labels[i])}
                </text>
              </g>
            ))}

          {/* per-node polylines — only draws with 2+ points, so single-reading nodes
              (e.g. right after their first live ingest) would otherwise render nothing
              at all; the markers below cover that case and make every reading visible */}
          {lines.map((l) =>
            l.coords.length > 1 ? (
              <polyline
                key={l.id}
                points={l.points}
                fill="none"
                stroke={colorForNodeIndex(l.index)}
                strokeWidth={l.flagged ? 1.5 : 2.5}
                strokeOpacity={l.flagged ? 0.25 : 0.85}
                strokeDasharray={l.flagged ? '4,4' : undefined}
              />
            ) : null
          )}

          {/* per-point markers — always drawn so individual readings (sparse data,
              or a lone first reading with nothing to connect a line to yet) stay visible */}
          {lines.map((l) =>
            l.coords.map((p, i) => (
              <circle
                key={`${l.id}-${i}`}
                cx={p.x}
                cy={p.y}
                r={l.flagged ? 2.5 : 3.5}
                fill={colorForNodeIndex(l.index)}
                fillOpacity={l.flagged ? 0.35 : 1}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            ))
          )}

          <rect x={MARGIN_LEFT} y={MARGIN_TOP} width={PLOT_WIDTH} height={SOIL_CHART_HEIGHT} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* hover columns */}
          {Array.from({ length: nL }, (_, i) => (
            <rect
              key={i}
              x={xToPx(i) - colW / 2}
              y={MARGIN_TOP}
              width={colW}
              height={SOIL_CHART_HEIGHT}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseMove={(e) => handleMove(e, i)}
            />
          ))}
        </svg>

        <ChartTooltip
          visible={!!hover && tooltipLines.length > 0}
          x={hover?.mouseX ?? 0}
          y={hover?.mouseY ?? 0}
          title={hover ? formatTooltipTitle(labels[hover.idx]) : ''}
          lines={tooltipLines}
        />
      </div>
    </div>
  );
}
