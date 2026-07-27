import { useState } from 'react';
import ViewModeToggle from '../filters/ViewModeToggle';
import TimeRangeToggle from '../filters/TimeRangeToggle';
import NodeFilterPanel from '../filters/NodeFilterPanel';
import { IconFilter, IconChevronDown } from '../icons/Icons';

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
  // Only affects narrow/mobile layouts (see .sidebar-toggle / .sidebar-body in
  // index.css) — on desktop the toggle button is hidden and the body is
  // always shown, this state is simply unused there.
  const [open, setOpen] = useState(false);

  return (
    <div className="sidebar" id="sidebar">
      <button
        type="button"
        className={`sidebar-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <IconFilter size={13} /> Filters
          <span className="node-count-badge">{activeNodes.size}/{nodeIds.length}</span>
        </span>
        <IconChevronDown size={14} className="sidebar-toggle-chevron" />
      </button>

      <div className={`sidebar-body${open ? ' open' : ''}`}>
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
    </div>
  );
}
