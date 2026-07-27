import { useEffect, useState } from 'react';
import { IconEdit } from '../components/icons/Icons';
import NodeManagementCard from '../components/settings/NodeManagementCard';
import CalibrationConstantsCard from '../components/settings/CalibrationConstantsCard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const EMPTY_FORM = { apiKey: '', applicationKey: '', stationMac: '' };

// current.apiKey/applicationKey from the API are already server-masked and end in the
// real last 4 chars (see backend mask()) — show a fixed-width dot run instead of echoing
// the server's exact star count, which varies with key length and looks noisy.
function maskedDisplay(serverMasked) {
  return serverMasked ? `${'•'.repeat(20)}${serverMasked.slice(-4)}` : '';
}

export default function SettingsPage() {
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [current, setCurrent] = useState(null); // { apiKey, applicationKey, stationMac, apiKeySet, applicationKeySet }
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null); // { type: 'ok'|'err', message }
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/config/ambient`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCurrent(data);
        setForm({ ...EMPTY_FORM, stationMac: data.stationMac || '' });
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  const startEdit = () => {
    setForm({ ...EMPTY_FORM, stationMac: current?.stationMac || '' });
    setStatus(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    setForm({ ...EMPTY_FORM, stationMac: current?.stationMac || '' });
    setStatus(null);
    setMode('view');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/config/ambient`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCurrent(data);
      setForm({ ...EMPTY_FORM, stationMac: data.stationMac || '' });
      setStatus({ type: 'ok', message: 'Saved — switch to the Graph Dashboard tab and refresh to fetch data with the new settings' });
      setMode('view');
    } catch (err) {
      setStatus({ type: 'err', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page-grid">
        <div className="settings-top-grid">
        <div className="chart-card">
          <div className="chart-hd">
            <div>
              <div className="chart-ttl">Ambient Weather API Settings</div>
              <div className="chart-sub">API Key / Application Key / Station MAC used by the backend to fetch weather station data</div>
            </div>
            {mode === 'view' && (
              <button className="f-btn" onClick={startEdit}><IconEdit size={13} /> Edit</button>
            )}
          </div>
          <div className="cc">
            {loadError && (
              <div className="settings-status err">Failed to load current settings: {loadError} — check that the backend is running at {BACKEND_URL}</div>
            )}

            {mode === 'view' ? (
              <>
                <div className="settings-field">
                  <label>API Key</label>
                  <div className={`settings-view-value${current?.apiKeySet ? '' : ' muted'}`}>
                    {current?.apiKeySet ? maskedDisplay(current.apiKey) : 'Not set'}
                  </div>
                </div>
                <div className="settings-field">
                  <label>Application Key</label>
                  <div className={`settings-view-value${current?.applicationKeySet ? '' : ' muted'}`}>
                    {current?.applicationKeySet ? maskedDisplay(current.applicationKey) : 'Not set'}
                  </div>
                </div>
                <div className="settings-field" style={{ marginBottom: 0 }}>
                  <label>Station MAC</label>
                  <div className={`settings-view-value${current?.stationMac ? '' : ' muted'}`}>
                    {current?.stationMac || 'Not set'}
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="settings-field">
                  <label htmlFor="apiKey">
                    API Key
                    {current?.apiKeySet && <span className="settings-current"> · current {maskedDisplay(current.apiKey)}</span>}
                  </label>
                  <input
                    id="apiKey"
                    className="settings-input"
                    type="password"
                    placeholder={current?.apiKeySet ? 'Enter a new value to change it (leave blank to keep current)' : 'Not set'}
                    value={form.apiKey}
                    onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                    autoComplete="off"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="applicationKey">
                    Application Key
                    {current?.applicationKeySet && <span className="settings-current"> · current {maskedDisplay(current.applicationKey)}</span>}
                  </label>
                  <input
                    id="applicationKey"
                    className="settings-input"
                    type="password"
                    placeholder={current?.applicationKeySet ? 'Enter a new value to change it (leave blank to keep current)' : 'Not set'}
                    value={form.applicationKey}
                    onChange={(e) => setForm((f) => ({ ...f, applicationKey: e.target.value }))}
                    autoComplete="off"
                  />
                </div>

                <div className="settings-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="stationMac">Station MAC</label>
                  <input
                    id="stationMac"
                    className="settings-input"
                    type="text"
                    placeholder="e.g. 10:91:A8:0D:D3:DC"
                    value={form.stationMac}
                    onChange={(e) => setForm((f) => ({ ...f, stationMac: e.target.value }))}
                    autoComplete="off"
                  />
                  <div className="settings-hint">The weather station's MAC (not a soil sensor node) — find it on the Devices page at ambientweather.net</div>
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

            {status && <div className={`settings-status ${status.type}`}>{status.message}</div>}
          </div>
        </div>

        <CalibrationConstantsCard />
        </div>

        <NodeManagementCard />
      </div>
    </div>
  );
}
