import { colorForNodeIndex } from '../../utils/nodeColors';
import { batteryStatus, estimatedDaysRemaining } from '../../utils/batteryStatus';

export default function BatteryGrid({ nodeIds, soilNodes }) {
  return (
    <div className="bg">
      {nodeIds.map((nodeId, index) => {
        const meta = soilNodes[nodeId].meta;
        const pct = meta.battery ?? 50;
        const status = batteryStatus(pct);
        const days = estimatedDaysRemaining(pct);
        return (
          <div className="bc" key={nodeId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="bc-name" style={{ color: colorForNodeIndex(index) }}>{nodeId.replace('Node_', 'Node ')}</div>
                <div className="bc-zone">{meta.treatment} · {meta.depth}cm</div>
              </div>
              <span className={`bdg bdg-${status.level === 'ok' ? 'ok' : status.level === 'warn' ? 'warn' : 'crit'}`}>{status.label}</span>
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
