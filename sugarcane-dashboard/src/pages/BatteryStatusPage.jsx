import BatteryGrid from '../components/battery/BatteryGrid';
import BatteryLevelChart from '../components/battery/BatteryLevelChart';

export default function BatteryStatusPage({ nodeIds, soilNodes }) {
  return (
    <div className="batt-page" id="main-battery" style={{ display: 'block' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
        Battery Status & Real-Time Network Levels
      </div>
      <BatteryGrid nodeIds={nodeIds} soilNodes={soilNodes} />

      <div className="chart-card">
        <div className="chart-hd">
          <div>
            <div className="chart-ttl">Battery Level by Sensor Node (%)</div>
            <div className="chart-sub">Comparing battery levels across all active sensors</div>
          </div>
        </div>
        <BatteryLevelChart nodeIds={nodeIds} soilNodes={soilNodes} />
      </div>
    </div>
  );
}
