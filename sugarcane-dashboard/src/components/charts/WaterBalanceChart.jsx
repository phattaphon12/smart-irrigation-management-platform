import { useMemo, useState } from 'react';
import { CHART_WIDTH, MARGIN_LEFT, MARGIN_TOP, MARGIN_BOTTOM, PLOT_WIDTH, WATER_BALANCE_CHART_HEIGHT as PH } from '../../constants/chartLayout';
import ChartTooltip from './ChartTooltip';

const H = PH + MARGIN_TOP + MARGIN_BOTTOM;

export default function WaterBalanceChart({ waterBalance }) {
  const [hover, setHover] = useState(null);
  const labels = waterBalance.timestamps;
  const nL = labels.length;

  const xP = (i) => (nL > 1 ? MARGIN_LEFT + (PLOT_WIDTH * i) / (nL - 1) : MARGIN_LEFT);

  const { dsMin, dsMax } = useMemo(() => {
    let min = -25;
    let max = 25;
    waterBalance.dstorage.forEach((v) => {
      if (v == null) return;
      if (v < min) min = Math.floor(v / 5) * 5 - 5;
      if (v > max) max = Math.ceil(v / 5) * 5 + 5;
    });
    return { dsMin: min, dsMax: max };
  }, [waterBalance.dstorage]);

  const y = (v) => MARGIN_TOP + PH * (1 - (v - dsMin) / (dsMax - dsMin));
  const y0 = y(0);

  const barWidth = Math.max(8, (PLOT_WIDTH / nL) * 0.28);
  const gap = 3;
  const wxStep = Math.max(1, Math.floor(nL / 10));
  const colW = nL > 0 ? PLOT_WIDTH / nL : PLOT_WIDTH;

  const handleMove = (e, idx) => {
    const rect = e.currentTarget.closest('.cc').getBoundingClientRect();
    setHover({ idx, mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top });
  };

  const tooltipLines = useMemo(() => {
    if (!hover) return [];
    const i = hover.idx;
    const rme = waterBalance.rain[i] - waterBalance.etc[i];
    const lines = [{ color: '#2563eb', label: 'Rain − Water Use', value: `${rme >= 0 ? '+' : ''}${rme.toFixed(1)} mm` }];
    const ds = waterBalance.dstorage[i];
    if (ds != null && !Number.isNaN(ds)) {
      lines.push({ color: ds >= 0 ? '#10b981' : '#ef4444', label: 'Moisture Change', value: `${ds >= 0 ? '+' : ''}${ds.toFixed(1)} mm` });
    }
    const event = (waterBalance.irrigation_events || []).find((ev) => ev.date === labels[i]);
    if (event) lines.push({ color: '#ea580c', label: 'Irrigation', value: `+${event.dstorage_mm.toFixed(0)} mm` });
    return lines;
  }, [hover, waterBalance, labels]);

  return (
    <div className="cc" style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CHART_WIDTH} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <rect x={MARGIN_LEFT} y={MARGIN_TOP} width={PLOT_WIDTH} height={y0 - MARGIN_TOP} fill="#f0fdf4" opacity="0.4" />
        <rect x={MARGIN_LEFT} y={y0} width={PLOT_WIDTH} height={MARGIN_TOP + PH - y0} fill="#fef2f2" opacity="0.4" />
        <line x1={MARGIN_LEFT} y1={y0} x2={MARGIN_LEFT + PLOT_WIDTH} y2={y0} stroke="#475569" strokeWidth="2" />

        {Array.from({ length: Math.floor((dsMax - dsMin) / 5) + 1 }, (_, k) => dsMin + k * 5).map((v) => (
          <g key={v}>
            <line x1={MARGIN_LEFT} y1={y(v)} x2={MARGIN_LEFT + PLOT_WIDTH} y2={y(v)} stroke="#f1f5f9" />
            <text x={MARGIN_LEFT - 12} y={y(v) + 4} fill="#64748b" fontSize="11" textAnchor="end" fontWeight={v === 0 ? '700' : '500'}>{v}</text>
          </g>
        ))}
        <text x="22" y={MARGIN_TOP + PH / 2} fill="#334155" fontSize="12" fontWeight="700" textAnchor="middle" transform={`rotate(-90,22,${MARGIN_TOP + PH / 2})`}>mm/day</text>
        <text x={MARGIN_LEFT + 12} y={y0 - 8} fill="#16a34a" fontSize="11" fontWeight="700">↑ Soil Gaining Moisture</text>
        <text x={MARGIN_LEFT + 12} y={y0 + 18} fill="#dc2626" fontSize="11" fontWeight="700">↓ Soil Losing Moisture</text>

        {labels.map((_, i) => {
          const rme = waterBalance.rain[i] - waterBalance.etc[i];
          const x = xP(i);
          const ds = waterBalance.dstorage[i];
          return (
            <g key={i}>
              {rme >= 0 ? (
                <rect x={x - barWidth - gap / 2} y={y(rme)} width={barWidth} height={y0 - y(rme)} fill="#3b82f6" rx="2" />
              ) : (
                <rect x={x - barWidth - gap / 2} y={y0} width={barWidth} height={y(rme) - y0} fill="#f87171" rx="2" />
              )}
              {ds != null && !Number.isNaN(ds) && (ds >= 0 ? (
                <rect x={x + gap / 2} y={y(ds)} width={barWidth} height={y0 - y(ds)} fill="#10b981" rx="2" />
              ) : (
                <rect x={x + gap / 2} y={y0} width={barWidth} height={y(ds) - y0} fill="#ef4444" rx="2" />
              ))}
            </g>
          );
        })}

        {(waterBalance.irrigation_events || []).map((ev) => {
          const idx = labels.indexOf(ev.date);
          if (idx < 0) return null;
          const x = xP(idx);
          const yt = y(ev.dstorage_mm);
          return (
            <g key={ev.date}>
              <polygon points={`${x},${yt - 18} ${x + 6},${yt - 10} ${x},${yt - 2} ${x - 6},${yt - 10}`} fill="#f97316" stroke="#ea580c" strokeWidth="1.2" />
              <text x={x} y={yt - 22} fill="#ea580c" fontSize="11" fontWeight="700" textAnchor="middle">+{ev.dstorage_mm.toFixed(0)}mm</text>
            </g>
          );
        })}

        <g>
          <rect x={MARGIN_LEFT + PLOT_WIDTH - 300} y={MARGIN_TOP + 10} width="290" height="74" fill="rgba(255,255,255,0.96)" rx="10" stroke="#cbd5e1" strokeWidth="1" />
          <rect x={MARGIN_LEFT + PLOT_WIDTH - 288} y={MARGIN_TOP + 23} width="14" height="10" fill="#3b82f6" rx="2" />
          <text x={MARGIN_LEFT + PLOT_WIDTH - 264} y={MARGIN_TOP + 32} fill="#475569" fontSize="11" fontWeight="500">Rain − Water Use (Weather Station)</text>
          <rect x={MARGIN_LEFT + PLOT_WIDTH - 288} y={MARGIN_TOP + 43} width="14" height="10" fill="#10b981" rx="2" />
          <text x={MARGIN_LEFT + PLOT_WIDTH - 264} y={MARGIN_TOP + 52} fill="#475569" fontSize="11" fontWeight="500">Moisture Change (Sensors)</text>
          <polygon points={`${MARGIN_LEFT + PLOT_WIDTH - 281},${MARGIN_TOP + 62} ${MARGIN_LEFT + PLOT_WIDTH - 276},${MARGIN_TOP + 67} ${MARGIN_LEFT + PLOT_WIDTH - 281},${MARGIN_TOP + 72} ${MARGIN_LEFT + PLOT_WIDTH - 286},${MARGIN_TOP + 67}`} fill="#f97316" />
          <text x={MARGIN_LEFT + PLOT_WIDTH - 264} y={MARGIN_TOP + 71} fill="#ea580c" fontSize="11" fontWeight="600">Irrigation Detected</text>
        </g>

        <rect x={MARGIN_LEFT} y={MARGIN_TOP} width={PLOT_WIDTH} height={PH} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

        {Array.from({ length: Math.ceil(nL / wxStep) }, (_, k) => k * wxStep)
          .filter((i) => i < nL)
          .map((i) => (
            <text key={i} x={xP(i)} y={MARGIN_TOP + PH + 22} fill="#64748b" fontSize="11" fontWeight="500" textAnchor="middle">
              {labels[i]?.substring(5)}
            </text>
          ))}

        {labels.map((_, i) => (
          <rect
            key={i}
            x={xP(i) - colW / 2}
            y={MARGIN_TOP}
            width={colW}
            height={PH}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseMove={(e) => handleMove(e, i)}
          />
        ))}
      </svg>

      <ChartTooltip visible={!!hover} x={hover?.mouseX ?? 0} y={hover?.mouseY ?? 0} title={hover ? labels[hover.idx] : ''} lines={tooltipLines} />
    </div>
  );
}
