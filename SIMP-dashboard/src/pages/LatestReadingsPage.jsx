import WeatherLoadingCard from '../components/charts/WeatherLoadingCard';
import { formatNumber, formatDateTime, formatShortDate } from '../utils/formatters';
import { isNodeOffline, isNodeStuckAtFloor, lastReadingTime } from '../utils/nodeStatus';
import {
  IconSun, IconDroplet, IconCloudRain, IconCheckCircle, IconWarning, IconWifiOff,
  IconSignal, IconRuler, IconGauge, IconClock,
} from '../components/icons/Icons';

function latestOf(arr) {
  return arr && arr.length ? arr[arr.length - 1] : null;
}

const TH_ICON_STYLE = { display: 'inline-flex', alignItems: 'center', gap: 5 };

export default function LatestReadingsPage({ nodeIds, soilNodes, weatherSummary, weatherLoading, weatherProgress }) {
  const wLen = weatherSummary?.timestamps?.length ?? 0;
  const latestIdx = wLen - 1;
  const latestDate = latestIdx >= 0 ? weatherSummary.timestamps[latestIdx] : null;
  const latestEto = latestIdx >= 0 ? weatherSummary.eto[latestIdx] : null;
  const latestEtc = latestIdx >= 0 ? weatherSummary.etc[latestIdx] : null;
  const latestRain = latestIdx >= 0 ? weatherSummary.rain[latestIdx] : null;

  return (
    <div className="batt-page" id="main-latest" style={{ display: 'block' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
        Latest Readings
      </div>

      {weatherLoading ? (
        <WeatherLoadingCard progress={weatherProgress} />
      ) : (
        <div className="chart-card">
          <div className="chart-hd">
            <div>
              <div className="chart-ttl">Weather — Latest Day</div>
              <div className="chart-sub">{latestDate ? formatShortDate(latestDate) : 'No data yet'}</div>
            </div>
          </div>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-amber"><IconSun size={19} /></div>
              <div>
                <div className="stat-label">ETo</div>
                <div className="stat-value">{formatNumber(latestEto)} <span className="stat-unit">mm/day</span></div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green"><IconDroplet size={19} /></div>
              <div>
                <div className="stat-label">ETc</div>
                <div className="stat-value">{formatNumber(latestEtc)} <span className="stat-unit">mm/day</span></div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-sky"><IconCloudRain size={19} /></div>
              <div>
                <div className="stat-label">Rain</div>
                <div className="stat-value">{formatNumber(latestRain)} <span className="stat-unit">mm</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="chart-card">
        <div className="chart-hd">
          <div>
            <div className="chart-ttl">Sensor Nodes — Latest Reading</div>
            <div className="chart-sub">Most recent kPa / VWC / %AWC / RSSI per sensor — not a historical view</div>
          </div>
        </div>
        {nodeIds.length === 0 ? (
          <div className="node-table-empty">No sensor nodes match this filter.</div>
        ) : (
          <div className="node-table-wrap">
            <table className="node-table">
              <thead>
                <tr>
                  <th>Sensor</th>
                  <th><span style={TH_ICON_STYLE}><IconRuler size={12} /> Depth</span></th>
                  <th>Treatment</th>
                  <th><span style={TH_ICON_STYLE}><IconGauge size={12} /> kPa</span></th>
                  <th><span style={TH_ICON_STYLE}><IconDroplet size={12} /> VWC</span></th>
                  <th><span style={TH_ICON_STYLE}><IconDroplet size={12} /> %AWC</span></th>
                  <th style={TH_ICON_STYLE} title="LoRaWAN signal strength (dBm) — attached by Node-RED from the uplink metadata.">
                    <IconSignal size={12} /> RSSI
                  </th>
                  <th><span style={TH_ICON_STYLE}><IconClock size={12} /> Last Reading</span></th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {nodeIds.map((id) => {
                  const node = soilNodes[id];
                  if (!node) return null;
                  const offline = isNodeOffline(node);
                  const stuck = !offline && isNodeStuckAtFloor(node);
                  const last = lastReadingTime(node);
                  return (
                    <tr key={id} className={offline ? 'row-invalid' : ''}>
                      <td style={{ fontWeight: 700 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <IconGauge size={13} style={{ color: 'var(--accent-green-dark)', flexShrink: 0 }} />
                          {id.replace('Node_', 'S')}
                        </span>
                      </td>
                      <td>{node.meta.depth}cm</td>
                      <td>{node.meta.treatment}</td>
                      <td>{formatNumber(latestOf(node.kpa), 1)}</td>
                      <td>{formatNumber(latestOf(node.vwc), 4)}</td>
                      <td>{formatNumber(latestOf(node.awc), 1)}</td>
                      <td>{formatNumber(latestOf(node.rssi), 0)}</td>
                      <td>{last ? formatDateTime(last) : '—'}</td>
                      <td>
                        {offline ? (
                          <span className="bdg bdg-offline"><IconWifiOff size={11} /> OFFLINE</span>
                        ) : stuck ? (
                          <span className="bdg bdg-warn"><IconWarning size={11} /> STUCK</span>
                        ) : (
                          <span className="bdg bdg-ok"><IconCheckCircle size={11} /> OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
