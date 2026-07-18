import { colorForNodeIndex } from '../../utils/nodeColors';

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
    <>
      <div className="fs">
        <div className="fl">Choose Sensor Nodes to Show</div>
        <div className="fb">
          <div className="fb-actions">
            <button className="f-btn" title="Select every sensor node" onClick={onSelectAll}>Select All</button>
            <button className="f-btn" title="Deselect all nodes" onClick={onSelectNone}>Clear All</button>
          </div>
          <button className="f-btn" style={{ width: 'calc(50% - 3px)' }} title="Select only nodes reporting normally" onClick={onSelectOk}>
            Normal
          </button>
          <button className="f-btn" style={{ width: 'calc(50% - 3px)' }} title="Select only nodes with issues (poor signal / erratic readings / very dry soil)" onClick={onSelectFlagged}>
            ⚠ Flagged
          </button>
        </div>
      </div>

      <div className="node-grid-container">
        <div className="fl" style={{ marginBottom: 6 }}>Sensor Node Map (tap to select/deselect)</div>
        <div className="node-legend">
          <div className="legend-item"><span className="depth-dot dot-20" /> 20cm deep</div>
          <div className="legend-item"><span className="depth-dot dot-40" /> 40cm deep</div>
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
                <span className="nm">
                  {meta.flagged ? '⚠ ' : ''}
                  {nodeId.replace('Node_', 'N')}
                </span>
                <span className={`depth-dot ${dotClass}`} />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
