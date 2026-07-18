export default function Header({ updatedLabel }) {
  return (
    <div className="hdr">
      <div>
        <h1>Sugarcane Field Monitor — Sa Bua Kam Plot</h1>
        <div className="sub" title="30 soil-moisture sensor nodes · KK3 variety · water-use calculated with the FAO-56 standard method">
          30 Sensor Nodes · KK3 Variety · Daily Average
        </div>
      </div>
      <div className="hdr-meta">Last Updated: {updatedLabel}</div>
    </div>
  );
}
