import { useEffect, useState } from 'react';
import {
  fetchTensiometerReadings, createTensiometerReading, deleteTensiometerReading, buildTensiometerExportUrl,
} from '../lib/api/tensiometerClient';
import { formatDateTime, formatNumber } from '../utils/formatters';
import { IconTrash, IconPlus } from '../components/icons/Icons';

const MATCH_WARN_SECONDS = 30 * 60; // beyond this, the closest sensor reading is too far away in time to trust as a comparison

function toDatetimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const EMPTY_FORM = { nodeCode: '', depthCm: '20', readingKpa: '', recordedAt: toDatetimeLocalValue(new Date()), notes: '' };

export default function CalibrationLogPage({ nodeIds }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState(null);

  const load = () => {
    setLoading(true);
    fetchTensiometerReadings()
      .then(({ rows: r }) => { setRows(r); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await createTensiometerReading({
        nodeCode: form.nodeCode,
        depthCm: Number(form.depthCm),
        readingKpa: Number(form.readingKpa),
        recordedAt: new Date(form.recordedAt).toISOString(),
        notes: form.notes || undefined,
      });
      setStatus({ type: 'ok', message: 'Tensiometer reading saved' });
      setForm({ ...EMPTY_FORM, recordedAt: toDatetimeLocalValue(new Date()) });
      setShowForm(false);
      load();
    } catch (err) {
      setStatus({ type: 'err', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete this tensiometer reading from ${row.node_code} at ${formatDateTime(row.recorded_at)}?`)) return;
    setBusyId(row.id);
    try {
      await deleteTensiometerReading(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setStatus({ type: 'err', message: `Delete failed: ${err.message}` });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="batt-page" id="main-calibration" style={{ display: 'block' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
        Soil Calibration Log
      </div>

      <div className="chart-card">
        <div className="chart-hd">
          <div>
            <div className="chart-ttl">Tensiometer Readings</div>
            <div className="chart-sub">
              Manual ground-truth readings for calibrating the Van Genuchten soil parameters — each entry is automatically matched
              against the nearest sensor reading (by time) from the same node
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="f-btn" onClick={() => (showForm ? setShowForm(false) : setShowForm(true))}>
              <IconPlus size={13} /> {showForm ? 'Cancel' : 'Add Reading'}
            </button>
            <a className="f-btn" href={buildTensiometerExportUrl()} download>Export CSV</a>
          </div>
        </div>

        <div className="cc">
          {showForm && (
            <form onSubmit={handleSubmit} className="node-add-form">
              <div className="node-add-grid">
                <div className="settings-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="t-node">Sensor node *</label>
                  <select
                    id="t-node"
                    className="settings-input"
                    required
                    value={form.nodeCode}
                    onChange={(e) => setForm((f) => ({ ...f, nodeCode: e.target.value }))}
                  >
                    <option value="">Select a node…</option>
                    {nodeIds.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
                <div className="settings-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="t-depth">Depth (cm) *</label>
                  <input id="t-depth" type="number" required className="settings-input" value={form.depthCm} onChange={(e) => setForm((f) => ({ ...f, depthCm: e.target.value }))} />
                </div>
                <div className="settings-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="t-kpa">Tensiometer reading (kPa) *</label>
                  <input id="t-kpa" type="number" step="any" required className="settings-input" placeholder="-33.0" value={form.readingKpa} onChange={(e) => setForm((f) => ({ ...f, readingKpa: e.target.value }))} />
                </div>
                <div className="settings-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="t-time">Date &amp; time *</label>
                  <input id="t-time" type="datetime-local" required className="settings-input" value={form.recordedAt} onChange={(e) => setForm((f) => ({ ...f, recordedAt: e.target.value }))} />
                </div>
                <div className="settings-field" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                  <label htmlFor="t-notes">Notes</label>
                  <input id="t-notes" className="settings-input" placeholder="Optional — soil condition, weather, etc." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <button className="f-btn settings-submit" type="submit" disabled={saving} style={{ marginTop: 16 }}>
                {saving ? 'Saving…' : 'Save Reading'}
              </button>
            </form>
          )}

          {status && <div className={`settings-status ${status.type}`} style={{ marginBottom: 16 }}>{status.message}</div>}
          {error && <div className="settings-status err">Failed to load readings: {error}</div>}

          {loading && rows.length === 0 ? (
            <div className="node-table-empty">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="node-table-empty">No tensiometer readings logged yet — click "Add Reading" to log the first one</div>
          ) : (
            <div className="node-table-wrap">
              <table className="node-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Sensor</th>
                    <th>Depth</th>
                    <th>Tensiometer kPa</th>
                    <th>Matched Sensor kPa</th>
                    <th title="How far apart in time the matched sensor reading is — beyond 30 min the comparison isn't reliable">Match Offset</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const offsetSec = row.match_offset_seconds != null ? Math.abs(Number(row.match_offset_seconds)) : null;
                    const staleMatch = offsetSec == null || offsetSec > MATCH_WARN_SECONDS;
                    return (
                      <tr key={row.id}>
                        <td>{formatDateTime(row.recorded_at)}</td>
                        <td style={{ fontWeight: 700 }}>{row.node_code}</td>
                        <td>{row.depth_cm} cm</td>
                        <td>{formatNumber(row.reading_kpa, 1)}</td>
                        <td>{row.matched_kpa != null ? formatNumber(row.matched_kpa, 1) : '—'}</td>
                        <td className={staleMatch ? 'cell-invalid' : undefined} title={offsetSec == null ? 'No sensor reading found for this node at all' : `${Math.round(offsetSec / 60)} min apart`}>
                          {offsetSec == null ? 'No match' : `${Math.round(offsetSec / 60)} min`}
                        </td>
                        <td>{row.notes || '—'}</td>
                        <td>
                          <button className="f-btn" title="Delete" onClick={() => handleDelete(row)} disabled={busyId === row.id}>
                            <IconTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
