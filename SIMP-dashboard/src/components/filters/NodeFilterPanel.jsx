import { colorForNodeIndex } from '../../utils/nodeColors';
import { isNodeOffline, isNodeStuckAtFloor } from '../../utils/nodeStatus';
import { IconWarning } from '../icons/Icons';

export default function NodeFilterPanel({
  nodeIds,
  soilNodes,
  activeNodes,
  onToggleNode,
  onSelectAll,
  onSelectNone,
  onSelectOk,
  onSelectFlagged,
}) {
  return (
    <div className="node-filter-section">
      <div className="fl node-filter-hd">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Sensor Nodes
          <span className="live-badge" title="Auto-refreshes every minute"><span className="live-dot" /> Live</span>
        </span>
        <span className="node-count-badge">{activeNodes.size}/{nodeIds.length} shown</span>
      </div>

      <div className="fb">
        <div className="fb-actions">
          <button className="f-btn" title="Select every sensor" onClick={onSelectAll}>Select All</button>
          <button className="f-btn" title="Deselect all sensors" onClick={onSelectNone}>Clear All</button>
        </div>
        <div className="fb-actions">
          <button className="f-btn" title="Select only sensors reporting normally" onClick={onSelectOk}>
            Normal
          </button>
          <button className="f-btn" title="Select only sensors with issues (poor signal / erratic readings / very dry soil)" onClick={onSelectFlagged}>
            <IconWarning size={12} /> Flagged
          </button>
        </div>
      </div>

      <div className="node-filter-subhd">
        <div className="node-legend">
          <div className="legend-item"><span className="depth-dot dot-20" /> 20cm deep</div>
          <div className="legend-item"><span className="depth-dot dot-40" /> 40cm deep</div>
        </div>
        <span className="node-filter-hint">Tap to toggle</span>
      </div>
      <div className="node-grid">
        {nodeIds.map((nodeId, index) => {
          const node = soilNodes[nodeId];
          const meta = node.meta;
          const dotClass = meta.depth === 20 ? 'dot-20' : meta.depth === 40 ? 'dot-40' : 'dot-spare';
          const isOn = activeNodes.has(nodeId);
          const offline = isNodeOffline(node);
          const stuck = !offline && isNodeStuckAtFloor(node);
          return (
            <button
              key={nodeId}
              className={`nb${isOn ? ' on' : ''}${offline ? ' nb-offline' : ''}${stuck ? ' nb-stuck' : ''}`}
              style={{ '--nc': colorForNodeIndex(index) }}
              title={`Treatment: ${meta.treatment} · Depth: ${meta.depth}cm · Status: ${meta.status}${meta.position ? ' · ' + meta.position : ''}${offline ? ' · Offline (no data for over 45 minutes)' : ''}${stuck ? ' · Reading pinned at the clip floor for several reports in a row — possible sensor fault' : ''}`}
              onClick={() => onToggleNode(nodeId)}
            >
              <span className="nm" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {meta.flagged && <IconWarning size={10} />}
                {meta.name || nodeId}
              </span>
              {offline ? (
                <span className="offline-tag">Offline</span>
              ) : stuck ? (
                <span className="offline-tag" style={{ color: '#b45309' }}>Stuck</span>
              ) : (
                <span className={`depth-dot ${dotClass}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
