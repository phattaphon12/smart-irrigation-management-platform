import { useEffect, useMemo, useState } from 'react';
import { fetchNodes, createNode, updateNode, deleteNode, sendDownlink } from '../../lib/api/nodesClient';
import { fetchDownlinkHistory } from '../../lib/api/downlinkClient';
import { IconPlus, IconEdit, IconTrash, IconRestore, IconChevronDown, IconBulb, IconClock } from '../icons/Icons';

const DOWNLINK_STATUS_LABEL = { pending: 'pending', sent: 'sent', failed: 'failed' };
const DOWNLINK_STATUS_CLASS = { pending: 'bdg-warn', sent: 'bdg-ok', failed: 'bdg-crit' };

const SORT_COLUMNS = [
  { key: 'node_id', label: 'Sensor ID' },
  { key: 'node_code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'depth', label: 'Depth' },
  { key: 'treatment', label: 'Treatment' },
  { key: 'position', label: 'Position' },
  { key: 'status', label: 'Status' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'eui', label: 'EUI' },
  { key: 'dev_addr', label: 'Dev Addr' },
  { key: 'board_serial', label: 'Board Serial' },
];

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
  board_serial: '',
};

export default function NodeManagementCard() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null); // null = adding, else editing this node
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('node_id');
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [downlinkBusyId, setDownlinkBusyId] = useState(null); // node_id currently sending a downlink command
  const [downlinkHistory, setDownlinkHistory] = useState([]);

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

  const loadDownlinkHistory = () => {
    fetchDownlinkHistory().then(setDownlinkHistory).catch(() => {}); // best-effort — doesn't block the node table
  };

  useEffect(loadNodes, []);
  useEffect(loadDownlinkHistory, []);

  // Most recent command per node, oldest-first history reduced to a lookup —
  // lets each row show whether Node-RED has actually picked up its last command yet.
  const latestCommandByNode = useMemo(() => {
    const map = new Map();
    for (const row of downlinkHistory) {
      const existing = map.get(row.node_id);
      if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
        map.set(row.node_id, row);
      }
    }
    return map;
  }, [downlinkHistory]);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const openAddForm = () => {
    setEditingNodeId(null);
    setForm(EMPTY_FORM);
    setStatus(null);
    setShowForm(true);
  };

  const openEditForm = (n) => {
    setEditingNodeId(n.node_id);
    setForm({
      node_id: n.node_id,
      node_code: n.node_code,
      name: n.name || '',
      depth: n.depth ?? '',
      treatment: n.treatment || '',
      position: n.position || '',
      status: n.status || '',
      flagged: n.flagged,
      eui: n.eui || '',
      dev_addr: n.dev_addr || '',
      board_serial: n.board_serial || '',
    });
    setStatus(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingNodeId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      if (editingNodeId != null) {
        const payload = { ...form, depth: form.depth === '' ? null : Number(form.depth) };
        delete payload.node_id;
        delete payload.node_code;
        await updateNode(editingNodeId, payload);
        setStatus({ type: 'ok', message: `Sensor ${form.node_code} updated` });
      } else {
        const payload = {
          ...form,
          node_id: form.node_id === '' ? null : Number(form.node_id),
          depth: form.depth === '' ? null : Number(form.depth),
        };
        await createNode(payload);
        setStatus({ type: 'ok', message: `Sensor ${payload.node_code} added successfully` });
      }
      closeForm();
      loadNodes();
    } catch (err) {
      setStatus({ type: 'err', message: `Failed to save sensor: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (n) => {
    if (!window.confirm(`Delete ${n.node_code}? It will disappear from the dashboard but its history is kept — you can restore it here.`)) return;
    try {
      await deleteNode(n.node_id);
      loadNodes();
      setStatus({ type: 'ok', message: `${n.node_code} deleted — switch to the Graph Dashboard tab and refresh to see it removed from the sensor picker` });
    } catch (err) {
      setStatus({ type: 'err', message: `Failed to delete sensor: ${err.message}` });
    }
  };

  const handleRestore = async (n) => {
    try {
      await updateNode(n.node_id, { active: true });
      loadNodes();
      setStatus({ type: 'ok', message: `${n.node_code} restored — switch to the Graph Dashboard tab and refresh to see it again` });
    } catch (err) {
      setStatus({ type: 'err', message: `Failed to restore sensor: ${err.message}` });
    }
  };

  const handleLed = async (n, value) => {
    setDownlinkBusyId(n.node_id);
    setStatus(null);
    try {
      await sendDownlink(n.node_id, 'led', value);
      setStatus({ type: 'ok', message: `LED ${value ? 'ON' : 'OFF'} queued for ${n.node_code} — will be sent next time Node-RED checks in` });
      loadDownlinkHistory();
    } catch (err) {
      setStatus({ type: 'err', message: `Failed to queue LED command for ${n.node_code}: ${err.message}` });
    } finally {
      setDownlinkBusyId(null);
    }
  };

  const handleSetInterval = async (n) => {
    const input = window.prompt(`Reporting interval for ${n.node_code} (minutes between transmissions):`, '15');
    if (input == null) return; // cancelled
    const minutes = Number(input);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      setStatus({ type: 'err', message: 'Interval must be a positive whole number of minutes' });
      return;
    }
    setDownlinkBusyId(n.node_id);
    setStatus(null);
    try {
      await sendDownlink(n.node_id, 'time', minutes);
      setStatus({ type: 'ok', message: `${minutes}-minute reporting interval queued for ${n.node_code} — will be sent next time Node-RED checks in` });
      loadDownlinkHistory();
    } catch (err) {
      setStatus({ type: 'err', message: `Failed to queue interval for ${n.node_code}: ${err.message}` });
    } finally {
      setDownlinkBusyId(null);
    }
  };

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const visibleNodes = useMemo(() => {
    let list = showInactive ? nodes : nodes.filter((n) => n.active);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((n) => n.node_code?.toLowerCase().includes(q) || n.name?.toLowerCase().includes(q));
    }

    const sorted = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      if (typeof av === 'boolean' && typeof bv === 'boolean') return Number(av) - Number(bv);
      return String(av).localeCompare(String(bv), undefined, { numeric: true });
    });
    return sortDir === 'asc' ? sorted : sorted.reverse();
  }, [nodes, showInactive, search, sortKey, sortDir]);

  return (
    <div className="chart-card">
      <div className="chart-hd">
        <div>
          <div className="chart-ttl">Sensor Nodes</div>
          <div className="chart-sub">All sensor nodes registered in the database</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="f-btn" onClick={() => setShowInactive((s) => !s)}>
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
          <button className="f-btn" onClick={() => (showForm ? closeForm() : openAddForm())}>
            <IconPlus size={13} /> {showForm ? 'Cancel' : 'Add Sensor'}
          </button>
        </div>
      </div>

      <div className="cc">
        {showForm && (
          <form onSubmit={handleSubmit} className="node-add-form">
            <div className="node-add-grid">
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="node_id">Sensor ID *</label>
                <input id="node_id" type="number" min="1" required disabled={editingNodeId != null} className="settings-input" placeholder="1" {...field('node_id')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="node_code">Sensor Code *</label>
                <input id="node_code" className="settings-input" required disabled={editingNodeId != null} placeholder="Sensor_031" {...field('node_code')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="name">Name</label>
                <input id="name" className="settings-input" placeholder="Sensor 031" {...field('name')} />
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
                <label htmlFor="eui">EUI (8 bytes)</label>
                <input id="eui" className="settings-input" placeholder="70B3D57ED0050AB1" maxLength={16} {...field('eui')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="dev_addr">Dev Addr (4 bytes)</label>
                <input id="dev_addr" className="settings-input" placeholder="7F5B2BE9" maxLength={8} {...field('dev_addr')} />
              </div>
              <div className="settings-field" style={{ marginBottom: 0 }}>
                <label htmlFor="board_serial">Board Serial</label>
                <input id="board_serial" className="settings-input" placeholder="e.g. printed on the board" maxLength={50} {...field('board_serial')} />
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
            <div className="settings-hint" style={{ marginTop: 10 }}>
              Need EUI / Dev Addr values? Generate LoRaWAN keys at{' '}
              <a href="https://www.loratools.nl/#/keys" target="_blank" rel="noopener noreferrer">loratools.nl/#/keys</a>.
            </div>
            <button className="f-btn settings-submit" type="submit" disabled={saving} style={{ marginTop: 16 }}>
              {saving ? 'Saving…' : editingNodeId != null ? 'Save Changes' : 'Save Sensor'}
            </button>
          </form>
        )}

        {status && <div className={`settings-status ${status.type}`} style={{ marginBottom: 16 }}>{status.message}</div>}
        {loadError && <div className="settings-status err">Failed to load sensor list: {loadError}</div>}

        {!loading && nodes.length > 0 && (
          <input
            type="search"
            className="settings-input"
            placeholder="Search by code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280, marginBottom: 14 }}
          />
        )}

        {loading ? (
          <div className="node-table-empty">Loading…</div>
        ) : visibleNodes.length === 0 ? (
          <div className="node-table-empty">
            {search.trim() ? `No sensors match "${search.trim()}"` : 'No sensors yet — click "Add Sensor" to add the first one'}
          </div>
        ) : (
          <div className="node-table-wrap">
            <table className="node-table">
              <thead>
                <tr>
                  {SORT_COLUMNS.map((col) => (
                    <th key={col.key}>
                      <button type="button" className="log-sort-btn" onClick={() => handleSort(col.key)}>
                        {col.label}
                        {sortKey === col.key && (
                          <IconChevronDown size={11} className={sortDir === 'asc' ? 'log-sort-asc' : undefined} />
                        )}
                      </button>
                    </th>
                  ))}
                  <th title="Sends a live command to the device via Node-RED — not saved to this app's database">Device</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleNodes.map((n) => (
                  <tr key={n.node_id} style={n.active ? undefined : { opacity: 0.55 }}>
                    <td>{n.node_id}</td>
                    <td style={{ fontWeight: 700 }}>{n.node_code}</td>
                    <td>{n.name || '—'}</td>
                    <td>{n.depth ?? '—'}</td>
                    <td>{n.treatment || '—'}</td>
                    <td>{n.position || '—'}</td>
                    <td>{n.status || '—'}</td>
                    <td>
                      {!n.active ? (
                        <span className="bdg bdg-crit">Inactive</span>
                      ) : n.flagged ? (
                        <span className="bdg bdg-warn">Flagged</span>
                      ) : (
                        <span className="bdg bdg-ok">OK</span>
                      )}
                    </td>
                    <td>{n.eui || '—'}</td>
                    <td>{n.dev_addr || '—'}</td>
                    <td>{n.board_serial || '—'}</td>
                    <td>
                      {n.active ? (
                        <div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="f-btn"
                              title="Turn LED on"
                              onClick={() => handleLed(n, 1)}
                              disabled={downlinkBusyId === n.node_id}
                            >
                              <IconBulb size={12} /> On
                            </button>
                            <button
                              className="f-btn"
                              title="Turn LED off"
                              onClick={() => handleLed(n, 0)}
                              disabled={downlinkBusyId === n.node_id}
                            >
                              <IconBulb size={12} /> Off
                            </button>
                            <button
                              className="f-btn"
                              title="Set reporting interval (minutes)"
                              onClick={() => handleSetInterval(n)}
                              disabled={downlinkBusyId === n.node_id}
                            >
                              <IconClock size={12} />
                            </button>
                          </div>
                          {latestCommandByNode.has(n.node_id) && (() => {
                            const cmd = latestCommandByNode.get(n.node_id);
                            return (
                              <div style={{ marginTop: 6, fontSize: 10 }} title={cmd.error || undefined}>
                                <span className={`bdg ${DOWNLINK_STATUS_CLASS[cmd.status] || 'bdg-offline'}`}>
                                  {cmd.command}={cmd.value} · {DOWNLINK_STATUS_LABEL[cmd.status] || cmd.status}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {n.active ? (
                          <>
                            <button className="f-btn" title="Edit sensor" onClick={() => openEditForm(n)}>
                              <IconEdit size={12} />
                            </button>
                            <button className="f-btn" title="Delete sensor (soft — keeps history)" onClick={() => handleDelete(n)}>
                              <IconTrash size={12} />
                            </button>
                          </>
                        ) : (
                          <button className="f-btn" title="Restore sensor" onClick={() => handleRestore(n)}>
                            <IconRestore size={12} /> Restore
                          </button>
                        )}
                      </div>
                    </td>
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
