import { useEffect, useState } from 'react';
import { fetchCropConfig, updateCropConfig } from '../../lib/api/cropConfigClient';
import { formatShortDate } from '../../utils/formatters';
import { IconEdit } from '../icons/Icons';

const CROP_TYPE_LABEL = { plantCrop: 'Plant crop', ratoon: 'Ratoon (อ้อยตอ)' };

export default function CropConfigCard() {
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ plantingDate: '', cropType: 'ratoon' });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchCropConfig()
      .then((data) => {
        setCurrent(data);
        setForm({ plantingDate: data.plantingDate, cropType: data.cropType });
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  const startEdit = () => {
    setForm({ plantingDate: current.plantingDate, cropType: current.cropType });
    setStatus(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    setForm({ plantingDate: current.plantingDate, cropType: current.cropType });
    setStatus(null);
    setMode('view');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const data = await updateCropConfig(form);
      setCurrent(data);
      setForm({ plantingDate: data.plantingDate, cropType: data.cropType });
      setStatus({ type: 'ok', message: 'Saved — the Water Use chart will use this on its next refresh.' });
      setMode('view');
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
          <div className="chart-ttl">Crop Cycle</div>
          <div className="chart-sub">Planting/cutting date and crop type — drives days-after-planting (DAP) and the Kc used for ETc</div>
        </div>
        {mode === 'view' && (
          <button className="f-btn" onClick={startEdit}><IconEdit size={13} /> Edit</button>
        )}
      </div>
      <div className="cc">
        {loadError && <div className="settings-status err">Failed to load crop config: {loadError}</div>}

        {!loadError && current == null ? (
          <div className="node-table-empty">Loading…</div>
        ) : mode === 'view' ? (
          <>
            <div className="settings-field">
              <label>Planting / cutting date</label>
              <div className="settings-view-value">{formatShortDate(current.plantingDate)} ({current.plantingDate})</div>
            </div>
            <div className="settings-field" style={{ marginBottom: 0 }}>
              <label>Crop type</label>
              <div className="settings-view-value">{CROP_TYPE_LABEL[current.cropType] || current.cropType}</div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="settings-field">
              <label htmlFor="plantingDate">Planting / cutting date</label>
              <input
                id="plantingDate"
                type="date"
                className="settings-input"
                value={form.plantingDate}
                onChange={(e) => setForm((f) => ({ ...f, plantingDate: e.target.value }))}
              />
              <div className="settings-hint">For a ratoon crop, use the date the previous cycle was cut — not the original planting date.</div>
            </div>
            <div className="settings-field" style={{ marginBottom: 0 }}>
              <label htmlFor="cropType">Crop type</label>
              <select
                id="cropType"
                className="settings-input"
                value={form.cropType}
                onChange={(e) => setForm((f) => ({ ...f, cropType: e.target.value }))}
              >
                <option value="plantCrop">Plant crop</option>
                <option value="ratoon">Ratoon (อ้อยตอ)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="f-btn settings-submit" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="f-btn" type="button" onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {status && <div className={`settings-status ${status.type}`} style={{ marginTop: 12 }}>{status.message}</div>}
      </div>
    </div>
  );
}
