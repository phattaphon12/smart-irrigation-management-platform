export default function Header({ weatherUpdatedLabel, sensorUpdatedLabel }) {
  return (
    <div className="hdr">
      <div>
        <h1>SIMP — Smart Irrigation Management Platform</h1>
      </div>
      <div className="hdr-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <div>Weather data: {weatherUpdatedLabel}</div>
        <div>Sensor data: {sensorUpdatedLabel}</div>
      </div>
    </div>
  );
}
