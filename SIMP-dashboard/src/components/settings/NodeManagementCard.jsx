import { useEffect, useState } from 'react';
import { fetchNodes, createNode } from '../../lib/api/nodesClient';
import { IconPlus } from '../icons/Icons';

const EMPTY_FORM = {
  node_id: '',
  node_code: '',
  name: '',
  depth: '',
  treatment: '',
  position: '',
  status: '',
  flagged: false,
  eui: '',
  dev_addr: '',
};

export default function NodeManagementCard() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const loadNodes = () => {
    setLoading(true);
    fetchNodes()
      .then((data) => {
        setNodes(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadNodes, []);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        ...form,
        node_id: form.node_id === '' ? null : Number(form.node_id),
        depth: form.depth === '' ? null : Number(form.depth),
      };
      await createNode(payload);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setStatus({ type: 'ok', message: `Node ${payload.node_code} added successfully` });
      loadNodes();
    } catch (err) {
      setStatus({ type: 'err', message: `Failed to add node: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-hd">
        <div>
          <div className="chart-ttl">Sensor Nodes</div>
          <div className="chart-sub">All sensor nodes registered in the database</div>
        </div>
        <button className="f-btn" onClick={() => setShowForm((s) => !s)}>
          <IconPlus size={13} /> {showForm ? 'Cancel' : 'Add Node'}
        </button>
      </div>

      <div className="cc">
        {showForm && (
          <form onSubmit={handleSubmit} className="node-add-form">
            <div className="node-add-grid">
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="node_id">Node ID *</label>
                <input id="node_id" type="number" min="1" required className="settings-input" placeholder="1" {...field('node_id')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="node_code">Node Code *</label>
                <input id="node_code" className="settings-input" required placeholder="Node_031" {...field('node_code')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="name">Name</label>
                <input id="name" className="settings-input" placeholder="Node 031" {...field('name')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="depth">Depth (cm)</label>
                <input id="depth" type="number" className="settings-input" placeholder="20" {...field('depth')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="treatment">Treatment</label>
                <input id="treatment" className="settings-input" placeholder="T1 / T2 / T3 / Control" {...field('treatment')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="position">Position</label>
                <input id="position" className="settings-input" {...field('position')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="status">Status</label>
                <input id="status" className="settings-input" placeholder="OK" {...field('status')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="eui">EUI</label>
                <input id="eui" className="settings-input" placeholder="70B3D57ED0050AB1" maxLength={16} {...field('eui')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="dev_addr">Dev Addr</label>
                <input id="dev_addr" className="settings-input" placeholder="7F5B2BE9" maxLength={8} {...field('dev_addr')} />
              </div>
              <label className="node-add-flagged" htmlFor="flagged">
                <input
                  id="flagged"
                  type="checkbox"
                  checked={form.flagged}
                  onChange={(e) => setForm((f) => ({ ...f, flagged: e.target.checked }))}
                />
                Flagged
              </label>
            </div>
            <button className="f-btn settings-submit" type="submit" disabled={saving} style={{ marginTop: 16 }}>
              {saving ? 'Saving…' : 'Save Node'}
            </button>
          </form>
        )}

        {status && <div className={`settings-status ${status.type}`} style={{ marginBottom: 16 }}>{status.message}</div>}
        {loadError && <div className="settings-status err">Failed to load node list: {loadError}</div>}

        {loading ? (
          <div className="node-table-empty">Loading…</div>
        ) : nodes.length === 0 ? (
          <div className="node-table-empty">No nodes yet — click "Add Node" to add the first one</div>
        ) : (
          <div className="node-table-wrap">
            <table className="node-table">
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Depth</th>
                  <th>Treatment</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Flagged</th>
                  <th>EUI</th>
                  <th>Dev Addr</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((n) => (
                  <tr key={n.node_id}>
                    <td>{n.node_id}</td>
                    <td style={{ fontWeight: 700 }}>{n.node_code}</td>
                    <td>{n.name || '—'}</td>
                    <td>{n.depth ?? '—'}</td>
                    <td>{n.treatment || '—'}</td>
                    <td>{n.position || '—'}</td>
                    <td>{n.status || '—'}</td>
                    <td>
                      {n.flagged ? <span className="bdg bdg-warn">Flagged</span> : <span className="bdg bdg-ok">OK</span>}
                    </td>
                    <td>{n.eui || '—'}</td>
                    <td>{n.dev_addr || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
