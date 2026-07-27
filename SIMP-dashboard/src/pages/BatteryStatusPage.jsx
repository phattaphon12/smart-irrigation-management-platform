import { useMemo, useState } from 'react';
import BatteryGrid from '../components/battery/BatteryGrid';
import BatteryLevelChart from '../components/battery/BatteryLevelChart';
import BatteryControls from '../components/filters/BatteryControls';
import { batteryStatus } from '../utils/batteryStatus';

export default function BatteryStatusPage({ nodeIds, soilNodes }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id');

  const shownNodeIds = useMemo(() => {
    let ids = nodeIds.filter((id) => {
      if (statusFilter === 'all') return true;
      return batteryStatus(soilNodes[id].meta.battery).level === statusFilter;
    });
    if (sortBy === 'battery-asc') {
      ids = [...ids].sort((a, b) => (soilNodes[a].meta.battery ?? 50) - (soilNodes[b].meta.battery ?? 50));
    } else if (sortBy === 'battery-desc') {
      ids = [...ids].sort((a, b) => (soilNodes[b].meta.battery ?? 50) - (soilNodes[a].meta.battery ?? 50));
    }
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeIds, soilNodes, statusFilter, sortBy]);

  return (
    <div className="batt-page" id="main-battery" style={{ display: 'block' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
        Battery Status & Real-Time Network Levels
      </div>

      <BatteryControls
        statusFilter={statusFilter}
        onChangeStatusFilter={setStatusFilter}
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
        shownCount={shownNodeIds.length}
        totalCount={nodeIds.length}
      />

      {shownNodeIds.length === 0 ? (
        <div className="chart-card">
          <div className="cc" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 16px' }}>
            No sensor nodes match this filter.
          </div>
        </div>
      ) : (
        <>
          <BatteryGrid nodeIds={shownNodeIds} soilNodes={soilNodes} />

          <div className="chart-card">
            <div className="chart-hd">
              <div>
                <div className="chart-ttl">Battery Level by Sensor (%)</div>
                <div className="chart-sub">Comparing battery levels across all active sensors</div>
              </div>
            </div>
            <BatteryLevelChart nodeIds={shownNodeIds} soilNodes={soilNodes} />
          </div>
        </>
      )}
    </div>
  );
}
