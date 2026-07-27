import { colorForNodeIndex } from '../../utils/nodeColors';
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
          <button className="f-btn" title="Select every sensor node" onClick={onSelectAll}>Select All</button>
          <button className="f-btn" title="Deselect all nodes" onClick={onSelectNone}>Clear All</button>
        </div>
        <div className="fb-actions">
          <button className="f-btn" title="Select only nodes reporting normally" onClick={onSelectOk}>
            Normal
          </button>
          <button className="f-btn" title="Select only nodes with issues (poor signal / erratic readings / very dry soil)" onClick={onSelectFlagged}>
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
          const meta = soilNodes[nodeId].meta;
          const dotClass = meta.depth === 20 ? 'dot-20' : meta.depth === 40 ? 'dot-40' : 'dot-spare';
          const isOn = activeNodes.has(nodeId);
          return (
            <button
              key={nodeId}
              className={`nb${isOn ? ' on' : ''}`}
              style={{ '--nc': colorForNodeIndex(index) }}
              title={`Treatment: ${meta.treatment} · Depth: ${meta.depth}cm · Status: ${meta.status}${meta.position ? ' · ' + meta.position : ''}`}
              onClick={() => onToggleNode(nodeId)}
            >
              <span className="nm" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {meta.flagged && <IconWarning size={10} />}
                {nodeId.replace('Node_', 'N')}
              </span>
              <span className={`depth-dot ${dotClass}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
