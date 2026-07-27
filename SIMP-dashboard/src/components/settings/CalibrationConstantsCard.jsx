import { useEffect, useState } from 'react';
import { fetchCalibrationConfig, updateCalibrationConfig } from '../../lib/api/calibrationClient';
import { IconEdit } from '../icons/Icons';

const FIELD_GROUPS = [
  {
    title: 'Resistance conversion',
    fields: [
      { key: 'r_divider_kohm', label: 'Divider resistor (kΩ)' },
      { key: 'adc_max', label: 'ADC max (12-bit)' },
      { key: 'adc_valid_min', label: 'ADC valid min (open-circuit cutoff)' },
    ],
  },
  {
    title: 'Shock & Seddigh (resistance → kPa)',
    fields: [
      { key: 'ss_a', label: 'a' },
      { key: 'ss_b', label: 'b' },
      { key: 'ss_c', label: 'c' },
      { key: 'ss_d', label: 'd' },
      { key: 'assumed_soil_temp_c', label: 'Assumed soil temp (°C)' },
      { key: 'kpa_clip_min', label: 'kPa clip min' },
    ],
  },
  {
    title: 'Van Genuchten (kPa → VWC)',
    fields: [
      { key: 'vg_theta_r', label: 'θr (residual)' },
      { key: 'vg_theta_s', label: 'θs (saturated)' },
      { key: 'vg_alpha', label: 'α' },
      { key: 'vg_n', label: 'n' },
    ],
  },
  {
    title: 'Water capacity (VWC → %AWC)',
    fields: [
      { key: 'wilting_point_vwc', label: 'Wilting point VWC' },
      { key: 'available_water_capacity', label: 'Available water capacity' },
    ],
  },
];

export default function CalibrationConstantsCard() {
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchCalibrationConfig()
      .then((data) => {
        setCurrent(data);
        setForm(data);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  const startEdit = () => {
    setForm(current);
    setStatus(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    setForm(current);
    setStatus(null);
    setMode('view');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const data = await updateCalibrationConfig(form);
      setCurrent(data);
      setForm(data);
      setStatus({
        type: 'ok',
        message: 'Saved — new ingests use this immediately. Existing history needs a Recalculate from the Log Management page.',
      });
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
          <div className="chart-ttl">Soil Moisture Calibration Constants</div>
          <div className="chart-sub">ADC → kPa → VWC → %AWC formula constants used to process every sensor reading</div>
        </div>
        {mode === 'view' && (
          <button className="f-btn" onClick={startEdit}><IconEdit size={13} /> Edit</button>
        )}
      </div>
      <div className="cc">
        {loadError && <div className="settings-status err">Failed to load calibration constants: {loadError}</div>}

        {!loadError && current == null ? (
          <div className="node-table-empty">Loading…</div>
        ) : mode === 'view' ? (
          FIELD_GROUPS.map((group) => (
            <div key={group.title} className="calib-group">
              <div className="calib-group-title">{group.title}</div>
              <div className="calib-group-grid">
                {group.fields.map(({ key, label }) => (
                  <div className="settings-field" key={key} style={{ marginBottom: 0 }}>
                    <label>{label}</label>
                    <div className="settings-view-value">{current[key]}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <form onSubmit={handleSubmit}>
            {FIELD_GROUPS.map((group) => (
              <div key={group.title} className="calib-group">
                <div className="calib-group-title">{group.title}</div>
                <div className="calib-group-grid">
                  {group.fields.map(({ key, label }) => (
                    <div className="settings-field" key={key} style={{ marginBottom: 0 }}>
                      <label htmlFor={key}>{label}</label>
                      <input
                        id={key}
                        type="number"
                        step="any"
                        className="settings-input"
                        value={form[key] ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value === '' ? '' : Number(e.target.value) }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

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
