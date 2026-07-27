import ViewModeToggle from '../filters/ViewModeToggle';
import TimeRangeToggle from '../filters/TimeRangeToggle';
import NodeFilterPanel from '../filters/NodeFilterPanel';

export default function Sidebar({
  soilNodes,
  nodeIds,
  activeNodes,
  viewMode,
  onChangeViewMode,
  timeRange,
  onChangeTimeRange,
  onToggleNode,
  onSelectAll,
  onSelectNone,
  onSelectOk,
  onSelectFlagged,
}) {
  return (
    <div className="sidebar" id="sidebar">
      <TimeRangeToggle range={timeRange} onChange={onChangeTimeRange} />
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
