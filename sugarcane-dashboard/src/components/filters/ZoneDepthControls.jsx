const TREATMENTS = ['T1', 'T2', 'T3', 'Control'];
const DEPTHS = [20, 40];

export default function ZoneDepthControls({ onSelectTreatment, onSelectDepth }) {
  return (
    <div className="chart-controls-inline">
      <div className="control-sub-item">
        <span className="ctl-label" title="Select sensor nodes by treatment group (T1–T3 = irrigation treatment plots, Ctrl = control plot)">Zone</span>
        <div className="fb-segmented">
          {TREATMENTS.map((t) => (
            <button key={t} className="f-btn" title={`Select every node in ${t}`} onClick={() => onSelectTreatment(t)}>
              {t === 'Control' ? 'Ctrl' : t}
            </button>
          ))}
        </div>
      </div>
      <div className="control-sub-item">
        <span className="ctl-label">Depth</span>
        <div className="fb-segmented">
          {DEPTHS.map((d) => (
            <button key={d} className="f-btn" title={`Select every node at ${d}cm depth`} onClick={() => onSelectDepth(d)}>
              {d}cm
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
