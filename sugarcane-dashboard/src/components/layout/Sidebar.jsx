import ViewModeToggle from '../filters/ViewModeToggle';
import NodeFilterPanel from '../filters/NodeFilterPanel';

export default function Sidebar({
  soilNodes,
  nodeIds,
  activeNodes,
  viewMode,
  onChangeViewMode,
  onToggleNode,
  onSelectAll,
  onSelectNone,
  onSelectOk,
  onSelectFlagged,
}) {
  return (
    <div className="sidebar" id="sidebar">
      <ViewModeToggle viewMode={viewMode} onChange={onChangeViewMode} />
      <NodeFilterPanel
        nodeIds={nodeIds}
        soilNodes={soilNodes}
        activeNodes={activeNodes}
        onToggleNode={onToggleNode}
        onSelectAll={onSelectAll}
        onSelectNone={onSelectNone}
        onSelectOk={onSelectOk}
        onSelectFlagged={onSelectFlagged}
      />
    </div>
  );
}
