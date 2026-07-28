import { useEffect, useState } from 'react';
import {
  fetchCalibrationProfiles, saveCalibrationProfile, loadCalibrationProfile, deleteCalibrationProfile,
} from '../../lib/api/calibrationProfilesClient';
import { formatShortDate } from '../../utils/formatters';
import { IconPlus, IconRestore, IconTrash } from '../icons/Icons';

export default function SiteProfilesCard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState(null);

  const load = () => {
    setLoading(true);
    fetchCalibrationProfiles()
      .then(({ rows }) => { setProfiles(rows); setLoadError(null); })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      await saveCalibrationProfile({ name: name.trim(), notes: notes.trim() || undefined });
      setName('');
      setNotes('');
      setShowForm(false);
      load();
      setStatus({ type: 'ok', message: 'Saved the current Calibration Constants + Crop Cycle values as a new profile' });
    } catch (err) {
      setStatus({ type: 'err', message: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadProfile = async (profile) => {
    if (!window.confirm(`Load "${profile.name}"? This overwrites the current Calibration Constants and Crop Cycle values (save them as a profile first if you want to keep them).`)) return;
    setBusyId(profile.id);
    try {
      await loadCalibrationProfile(profile.id);
      window.location.reload(); // simplest way to get every Settings card (which each fetch on mount) to pick up the new values
    } catch (err) {
      setStatus({ type: 'err', message: `Load failed: ${err.message}` });
      setBusyId(null);
    }
  };

  const handleDelete = async (profile) => {
    if (!window.confirm(`Delete the saved profile "${profile.name}"? This only removes the saved snapshot, not the currently active values.`)) return;
    setBusyId(profile.id);
    try {
      await deleteCalibrationProfile(profile.id);
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    } catch (err) {
      setStatus({ type: 'err', message: `Delete failed: ${err.message}` });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-hd">
        <div>
          <div className="chart-ttl">Site Profiles</div>
          <div className="chart-sub">Save/restore named snapshots of Calibration Constants + Crop Cycle — use before recalibrating for a different plot so the old values aren't lost</div>
        </div>
        <button className="f-btn" onClick={() => setShowForm((s) => !s)}>
          <IconPlus size={13} /> {showForm ? 'Cancel' : 'Save Current'}
        </button>
      </div>
      <div className="cc">
        {showForm && (
          <form onSubmit={handleSave} style={{ marginBottom: 16 }}>
            <div className="settings-field">
              <label htmlFor="profile-name">Profile name *</label>
              <input id="profile-name" className="settings-input" required placeholder="e.g. Sa Bua Kam - Apr 2026" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="settings-field" style={{ marginBottom: 0 }}>
              <label htmlFor="profile-notes">Notes</label>
              <input id="profile-notes" className="settings-input" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button className="f-btn settings-submit" type="submit" disabled={saving} style={{ marginTop: 12 }}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        )}

        {loadError && <div className="settings-status err">Failed to load profiles: {loadError}</div>}
        {status && <div className={`settings-status ${status.type}`} style={{ marginBottom: 12 }}>{status.message}</div>}

        {loading ? (
          <div className="node-table-empty">Loading…</div>
        ) : profiles.length === 0 ? (
          <div className="node-table-empty">No saved profiles yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {profiles.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: 'var(--bg)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Saved {formatShortDate(p.created_at)} · {p.crop_type === 'ratoon' ? 'Ratoon' : 'Plant crop'} from {formatShortDate(p.planting_date)}
                    {p.notes ? ` · ${p.notes}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="f-btn" title="Load this profile" onClick={() => handleLoadProfile(p)} disabled={busyId === p.id}>
                    <IconRestore size={12} /> Load
                  </button>
                  <button className="f-btn" title="Delete this saved profile" onClick={() => handleDelete(p)} disabled={busyId === p.id}>
                    <IconTrash size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
