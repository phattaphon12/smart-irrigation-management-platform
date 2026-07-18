import { useMemo, useState } from 'react';
import { CHART_WIDTH, MARGIN_LEFT, MARGIN_TOP, MARGIN_BOTTOM, PLOT_WIDTH, ET_CHART_HEIGHT } from '../../constants/chartLayout';
import ChartTooltip from './ChartTooltip';

const H = ET_CHART_HEIGHT + MARGIN_TOP + MARGIN_BOTTOM;
const CUM_ET_MAX = 1100;
const CUM_RAIN_MAX = 700;
const DAILY_ET_MAX = 7;

export default function EvapotranspirationChart({ summary, seriesOn, cumulative }) {
  const [hover, setHover] = useState(null);
  const labels = summary.timestamps;
  const nL = labels.length;

  const wxP = (i) => (nL > 1 ? MARGIN_LEFT + (PLOT_WIDTH * i) / (nL - 1) : MARGIN_LEFT);

  const rMax = useMemo(() => {
    let m = 50;
    summary.rain.forEach((v) => {
      if (v > m) m = Math.ceil(v / 10) * 10;
    });
    return m;
  }, [summary.rain]);

  const cEY = (v) => MARGIN_TOP + ET_CHART_HEIGHT * (1 - v / CUM_ET_MAX);
  const cRY = (v) => MARGIN_TOP + ET_CHART_HEIGHT * (1 - v / CUM_RAIN_MAX);
  const eY = (v) => MARGIN_TOP + ET_CHART_HEIGHT * (1 - v / DAILY_ET_MAX);
  const rY = (v) => MARGIN_TOP + ET_CHART_HEIGHT * (1 - v / rMax);

  const wxStep = Math.max(1, Math.floor(nL / 10));
  const barWidth = Math.max(8, (PLOT_WIDTH / nL) * 0.35);
  const colW = nL > 0 ? PLOT_WIDTH / nL : PLOT_WIDTH;

  const handleMove = (e, idx) => {
    const rect = e.currentTarget.closest('.cc').getBoundingClientRect();
    setHover({ idx, mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top });
  };

  const tooltipLines = useMemo(() => {
    if (!hover) return [];
    const i = hover.idx;
    const lines = [];
    if (cumulative) {
      if (seriesOn.eto) lines.push({ color: '#ea580c', label: 'ΣETo', value: `${summary.cum_eto[i].toFixed(1)} mm` });
      if (seriesOn.etc) lines.push({ color: '#dc2626', label: 'ΣETc', value: `${summary.cum_etc[i].toFixed(1)} mm` });
      if (seriesOn.rain) lines.push({ color: '#2563eb', label: 'ΣRain', value: `${summary.cum_rain[i].toFixed(1)} mm` });
    } else {
      if (seriesOn.eto) lines.push({ color: '#ea580c', label: 'ETo', value: `${summary.eto[i].toFixed(2)} mm` });
      if (seriesOn.etc) lines.push({ color: '#dc2626', label: 'ETc', value: `${summary.etc[i].toFixed(2)} mm` });
      if (seriesOn.rain) lines.push({ color: '#2563eb', label: 'Rain', value: `${summary.rain[i].toFixed(1)} mm` });
    }
    return lines;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, cumulative, seriesOn, summary]);

  return (
    <div className="cc" style={{ position: 'relative' }} onMouseLeave={() => setHover(null)}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${CHART_WIDTH} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <rect x={MARGIN_LEFT} y={MARGIN_TOP} width={PLOT_WIDTH} height={ET_CHART_HEIGHT} fill="#ffffff" />

        {cumulative ? (
          <>
            {Array.from({ length: 6 }, (_, i) => Math.round((CUM_ET_MAX * i) / 5)).map((val) => (
              <g key={val}>
                <line x1={MARGIN_LEFT} y1={cEY(val)} x2={MARGIN_LEFT + PLOT_WIDTH} y2={cEY(val)} stroke="#f1f5f9" />
                <text x={MARGIN_LEFT - 12} y={cEY(val) + 4} fill="#ea580c" fontSize="11" fontWeight="500" textAnchor="end">{val}</text>
              </g>
            ))}
            <text x="22" y={MARGIN_TOP + ET_CHART_HEIGHT / 2} fill="#ea580c" fontSize="12" fontWeight="700" textAnchor="middle" transform={`rotate(-90,22,${MARGIN_TOP + ET_CHART_HEIGHT / 2})`}>ΣET (mm)</text>
            {Array.from({ length: 6 }, (_, i) => Math.round((CUM_RAIN_MAX * i) / 5)).map((val) => (
              <text key={val} x={MARGIN_LEFT + PLOT_WIDTH + 12} y={cRY(val) + 4} fill="#2563eb" fontSize="11" fontWeight="500">{val}</text>
            ))}

            {seriesOn.rain && (() => {
              const base = cRY(0);
              const pts = labels.map((_, li) => ({ x: wxP(li), y: cRY(summary.cum_rain[li]) }));
              if (pts.length <= 1) return null;
              const areaPts = `${pts[0].x},${base} ${pts.map((p) => `${p.x},${p.y}`).join(' ')} ${pts[pts.length - 1].x},${base}`;
              const linePts = pts.map((p) => `${p.x},${p.y}`).join(' ');
              return (
                <>
                  <polygon points={areaPts} fill="rgba(37,99,235,0.06)" />
                  <polyline points={linePts} fill="none" stroke="#2563eb" strokeWidth="2.5" />
                </>
              );
            })()}
            {seriesOn.eto && (
              <polyline points={labels.map((_, li) => `${wxP(li)},${cEY(summary.cum_eto[li])}`).join(' ')} fill="none" stroke="#f97316" strokeWidth="2.5" />
            )}
            {seriesOn.etc && (
              <polyline points={labels.map((_, li) => `${wxP(li)},${cEY(summary.cum_etc[li])}`).join(' ')} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="5,4" />
            )}
          </>
        ) : (
          <>
            {Array.from({ length: 5 }, (_, i) => (DAILY_ET_MAX * i) / 4).map((val) => (
              <g key={val}>
                <line x1={MARGIN_LEFT} y1={eY(val)} x2={MARGIN_LEFT + PLOT_WIDTH} y2={eY(val)} stroke="#f1f5f9" />
                <text x={MARGIN_LEFT - 12} y={eY(val) + 4} fill="#ea580c" fontSize="11" fontWeight="500" textAnchor="end">{val.toFixed(0)}</text>
              </g>
            ))}
            <text x="22" y={MARGIN_TOP + ET_CHART_HEIGHT / 2} fill="#ea580c" fontSize="12" fontWeight="700" textAnchor="middle" transform={`rotate(-90,22,${MARGIN_TOP + ET_CHART_HEIGHT / 2})`}>ET (mm)</text>
            {Array.from({ length: 5 }, (_, i) => Math.round((rMax * i) / 4)).map((val) => (
              <text key={val} x={MARGIN_LEFT + PLOT_WIDTH + 12} y={rY(val) + 4} fill="#2563eb" fontSize="11" fontWeight="500">{val}</text>
            ))}

            {seriesOn.rain &&
              labels.map((_, li) => {
                const v = summary.rain[li];
                if (!v) return null;
                const x = wxP(li);
                return <rect key={li} x={x - barWidth / 2} y={rY(v)} width={barWidth} height={rY(0) - rY(v)} fill="rgba(37,99,235,0.35)" rx="3" />;
              })}
            {seriesOn.eto && (
              <polyline points={labels.map((_, li) => `${wxP(li)},${eY(summary.eto[li])}`).join(' ')} fill="none" stroke="#f97316" strokeWidth="2.5" />
            )}
            {seriesOn.etc && (
              <polyline points={labels.map((_, li) => `${wxP(li)},${eY(summary.etc[li])}`).join(' ')} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="5,4" />
            )}
          </>
        )}

        <rect x={MARGIN_LEFT} y={MARGIN_TOP} width={PLOT_WIDTH} height={ET_CHART_HEIGHT} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

        {Array.from({ length: Math.ceil(nL / wxStep) }, (_, k) => k * wxStep)
          .filter((i) => i < nL)
          .map((i) => (
            <text key={i} x={wxP(i)} y={MARGIN_TOP + ET_CHART_HEIGHT + 22} fill="#64748b" fontSize="11" fontWeight="500" textAnchor="middle">
              {labels[i]?.substring(5)}
            </text>
          ))}

        {labels.map((_, i) => (
          <rect
            key={i}
            x={wxP(i) - colW / 2}
            y={MARGIN_TOP}
            width={colW}
            height={ET_CHART_HEIGHT}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseMove={(e) => handleMove(e, i)}
          />
        ))}
      </svg>

      <ChartTooltip visible={!!hover && tooltipLines.length > 0} x={hover?.mouseX ?? 0} y={hover?.mouseY ?? 0} title={hover ? labels[hover.idx] : ''} lines={tooltipLines} />
    </div>
  );
}
