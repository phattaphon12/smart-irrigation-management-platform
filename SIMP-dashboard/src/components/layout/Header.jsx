export default function Header({ updatedLabel }) {
  return (
    <div className="hdr">
      <div>
        <h1>Sugarcane Field Monitor — Sa Bua Kam Plot</h1>
      </div>
      <div className="hdr-meta">Last Updated: {updatedLabel}</div>
    </div>
  );
}
