export function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatNumber(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toFixed(digits);
}
