export default function ChartTooltip({ visible, x, y, title, lines }) {
  if (!visible) return null;
  return (
    <div
      className="tip"
      style={{ display: 'block', left: x + 16, top: y + 16 }}
    >
      <div className="td">{title}</div>
      {lines.map((line, i) => (
        <div key={i} style={{ color: line.color }}>
          {line.label}: <b>{line.value}</b>
        </div>
      ))}
    </div>
  );
}
