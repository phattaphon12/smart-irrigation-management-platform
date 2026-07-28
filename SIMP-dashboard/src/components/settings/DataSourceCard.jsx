import { useEffect, useState } from 'react';
import { fetchIngestConfig, updateIngestConfig } from '../../lib/api/ingestConfigClient';

const OPTIONS = [
  { value: 'bench', label: 'Bench test', hint: 'Sensors on a desk (water bath / variable resistor) — not in the ground' },
  { value: 'field', label: 'Field', hint: 'Sensors installed in the actual plot' },
  { value: 'demo', label: 'Demo', hint: 'A live demonstration run — neither research data nor a bench test' },
];

export default function DataSourceCard() {
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchIngestConfig()
      .then((data) => setCurrent(data))
      .catch((err) => setLoadError(err.message));
  }, []);

  const handleChange = async (value) => {
    if (value === current?.dataSource) return;
    setSaving(true);
    setStatus(null);
    try {
      const data = await updateIngestConfig({ dataSource: value });
      setCurrent(data);
      setStatus({ type: 'ok', message: `New readings are now tagged "${value}" — history already ingested keeps its original tag.` });
    } catch (err) {
      setStatus({ type: 'err', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-hd">
        <div>
          <div className="chart-ttl">Data Source</div>
          <div className="chart-sub">Tags every new sensor reading as it comes in, so bench-test data never mixes with real field data</div>
        </div>
      </div>
      <div className="cc">
        {loadError && <div className="settings-status err">Failed to load: {loadError}</div>}
        {!loadError && current == null ? (
          <div className="node-table-empty">Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                  borderRadius: 10, cursor: saving ? 'default' : 'pointer',
                  background: current.dataSource === opt.value ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="dataSource"
                  checked={current.dataSource === opt.value}
                  disabled={saving}
                  onChange={() => handleChange(opt.value)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.hint}</div>
                </div>
              </label>
            ))}
          </div>
        )}
        {status && <div className={`settings-status ${status.type}`} style={{ marginTop: 12 }}>{status.message}</div>}
      </div>
    </div>
  );
}
