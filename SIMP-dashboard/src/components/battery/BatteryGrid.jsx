import { colorForNodeIndex, nodeIndexFromId } from '../../utils/nodeColors';
import { batteryStatus, estimatedDaysRemaining } from '../../utils/batteryStatus';
import { isNodeOffline } from '../../utils/nodeStatus';

export default function BatteryGrid({ nodeIds, soilNodes }) {
  return (
    <div className="bg">
      {nodeIds.map((nodeId) => {
        const node = soilNodes[nodeId];
        const meta = node.meta;
        const pct = meta.battery ?? 50;
        // No data for over an hour (same threshold as the Graph Dashboard) means
        // we can no longer vouch for this being the sensor's current battery level
        // either, so offline overrides whatever the percentage-based status says.
        const offline = isNodeOffline(node);
        const status = offline ? { level: 'offline', label: 'OFFLINE', color: '#94a3b8' } : batteryStatus(pct);
        const days = estimatedDaysRemaining(pct);
        return (
          <div className={`bc${offline ? ' bc-offline' : ''}`} key={nodeId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="bc-name" style={{ color: colorForNodeIndex(nodeIndexFromId(nodeId)) }}>{meta.name || nodeId}</div>
                <div className="bc-zone">{meta.treatment} · {meta.depth}cm</div>
              </div>
              <span className={`bdg bdg-${offline ? 'offline' : status.level === 'ok' ? 'ok' : status.level === 'warn' ? 'warn' : 'crit'}`}>{status.label}</span>
            </div>
            <div className="bc-bar">
              <div className="bc-fill" style={{ width: `${pct}%`, background: status.color }} />
            </div>
            <div className="bc-bot">
              <span className="bc-pct" style={{ color: status.color }}>{pct}%</span>
              <span className="bc-days" title="Estimated remaining runtime">~{days} days left</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
