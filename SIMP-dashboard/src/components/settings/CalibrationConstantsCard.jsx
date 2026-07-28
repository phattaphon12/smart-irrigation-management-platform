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
      { key: 'adc_valid_max', label: 'ADC valid max (sensor operating limit)' },
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

        <details className="calib-help">
          <summary>How this formula works — what to enter and why</summary>
          <div className="calib-help-note">
            Every raw ADC reading is run through four steps, in order, to get kPa → VWC → %AWC.
            Changing a value here only affects <strong>new</strong> readings right away — to re-apply it to
            existing history, use Recalculate / Recalculate All on the Log Management page.
          </div>
          <ol>
            <li>
              <strong>ADC → Resistance (kΩ)</strong> — <code>R = r_divider_kohm × (adc_max ÷ ADC − 1)</code>
              <ul>
                <li><b>Divider resistor (kΩ)</b>: the fixed resistor value in the node's voltage-divider circuit — comes from the hardware/datasheet, not something to tune by feel.</li>
                <li><b>ADC max</b>: the ADC's full-scale value (4095 for a 12-bit ADC). Only change this if the sensor board's ADC resolution changes.</li>
                <li><b>ADC valid min</b>: raw ADC readings at or below this are treated as an open circuit (sensor disconnected) and kPa/VWC/%AWC come back empty. Raise it if disconnected sensors still produce believable readings; lower it if valid dry readings are being rejected.</li>
                <li><b>ADC valid max</b>: raw ADC readings at or above this are also treated as invalid — past this point resistance is high enough that the kPa equation's denominator goes unstable and can flip the result to an impossible positive value. Keep this near the sensor's real observed operating range, not the theoretical ADC max.</li>
              </ul>
            </li>
            <li>
              <strong>Resistance → kPa</strong> (Shock &amp; Seddigh equation, Watermark 200SS) — <code>kPa = clamp((a×R + b) ÷ (1 − d×T − c×R), kPa clip min, 0)</code>
              <ul>
                <li><b>a, b, c, d</b>: regression coefficients from the sensor's published calibration equation — leave as-is unless re-fitting against a lab reference for a different sensor model or batch.</li>
                <li><b>Assumed soil temp (°C)</b>: soil temperature used in the correction term (there's no live temperature input yet) — set to the field's typical soil temperature.</li>
                <li><b>kPa clip min</b>: a floor value — the raw equation can return unrealistically low kPa in very wet soil, so results are clamped up to this.</li>
              </ul>
            </li>
            <li>
              <strong>kPa → VWC</strong> (Van Genuchten retention curve) — <code>VWC = θr + (θs − θr) ÷ (1 + (α×|kPa|)^n)^(1−1/n)</code>
              <ul>
                <li><b>θr (residual)</b>: the VWC the soil never drops below, however dry.</li>
                <li><b>θs (saturated)</b>: the VWC at full saturation.</li>
                <li><b>α, n</b>: curve-shape parameters from a soil-specific Van Genuchten fit (usually from a soil lab or texture lookup table) — should match the field's soil type rather than be tuned freely.</li>
              </ul>
            </li>
            <li>
              <strong>VWC → %AWC</strong> (Available Water Capacity — the usable-water range remaining) — <code>%AWC = (VWC − wilting point) ÷ available water capacity × 100</code>
              <ul>
                <li><b>Wilting point VWC</b>: VWC at the permanent wilting point (0% AWC — plants can no longer extract water).</li>
                <li><b>Available water capacity</b>: the usable water range (field-capacity VWC minus wilting-point VWC) — the denominator, so 100% AWC lines up with field capacity.</li>
              </ul>
            </li>
          </ol>
        </details>

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
