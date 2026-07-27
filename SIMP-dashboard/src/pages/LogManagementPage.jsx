import { useEffect, useRef, useState } from 'react';
import { fetchLogs, deleteLog, bulkDeleteLogs, recalculateLog, recalculateAllLogs, buildExportUrl } from '../lib/api/logsClient';
import { formatDateTime, formatNumber } from '../utils/formatters';
import { IconTrash, IconRefresh, IconChevronDown } from '../components/icons/Icons';

const PAGE_SIZE = 50;
const POLL_MS = 60000; // match the sensor nodes' ~1-reading-per-minute cadence

const COLUMNS = [
  { key: 'created_at', label: 'Timestamp' },
  { key: 'node_code', label: 'Sensor' },
  { key: 'rst', label: 'RST' },
  { key: 'radc', label: 'RADC' },
  { key: 'batt', label: 'BATT' },
  { key: 'badc', label: 'BADC' },
  { key: 'kpa', label: 'kPa' },
  { key: 'vwc', label: 'VWC' },
  { key: 'awc', label: '%AWC' },
];

export default function LogManagementPage({ nodeIds }) {
  const [nodeFilter, setNodeFilter] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null); // row currently being deleted/recalculated
  const [recalcAllBusy, setRecalcAllBusy] = useState(false);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const load = (nextOffset = 0) => {
    setLoading(true);
    fetchLogs({ nodeCode: nodeFilter || undefined, limit: PAGE_SIZE, offset: nextOffset, sort: sortKey, dir: sortDir })
      .then(({ rows: r, total: t }) => {
        setRows((prev) => (nextOffset === 0 ? r : [...prev, ...r]));
        setTotal(t);
        setOffset(nextOffset);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSelectedIds(new Set());
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeFilter, sortKey, sortDir]);

  // Background auto-refresh — re-fetches the same window the user has
  // already loaded (not just the first page, so "Load more" progress isn't
  // lost) and swaps it in silently. A failed poll just keeps showing the
  // last-known-good rows instead of surfacing an error banner.
  const rowsLengthRef = useRef(0);
  rowsLengthRef.current = rows.length;

  useEffect(() => {
    const id = setInterval(() => {
      const windowSize = Math.max(rowsLengthRef.current, PAGE_SIZE);
      fetchLogs({ nodeCode: nodeFilter || undefined, limit: windowSize, offset: 0, sort: sortKey, dir: sortDir })
        .then(({ rows: r, total: t }) => {
          setRows(r);
          setTotal(t);
        })
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [nodeFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        rows.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      rows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete this reading from ${row.node_code} at ${formatDateTime(row.created_at)}?`)) return;
    setBusyId(row.id);
    try {
      await deleteLog(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setTotal((t) => t - 1);
      setSelectedIds((prev) => {
        if (!prev.has(row.id)) return prev;
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    } catch (err) {
      setStatus({ type: 'err', message: `Delete failed: ${err.message}` });
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected reading${ids.length === 1 ? '' : 's'}? This can't be undone.`)) return;
    setBulkDeleteBusy(true);
    setStatus(null);
    try {
      const { deleted } = await bulkDeleteLogs(ids);
      setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setTotal((t) => t - deleted);
      setSelectedIds(new Set());
      setStatus({ type: 'ok', message: `Deleted ${deleted} row${deleted === 1 ? '' : 's'}` });
    } catch (err) {
      setStatus({ type: 'err', message: `Delete selected failed: ${err.message}` });
    } finally {
      setBulkDeleteBusy(false);
    }
  };

  const handleRecalculate = async (row) => {
    setBusyId(row.id);
    try {
      const { kpa, vwc, awc } = await recalculateLog(row.id);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, kpa, vwc, awc } : r)));
    } catch (err) {
      setStatus({ type: 'err', message: `Recalculate failed: ${err.message}` });
    } finally {
      setBusyId(null);
    }
  };

  const handleRecalculateAll = async () => {
    if (!window.confirm(`Recalculate kPa/VWC/%AWC for all ${total} log rows using the current calibration constants?`)) return;
    setRecalcAllBusy(true);
    setStatus(null);
    try {
      const { updated } = await recalculateAllLogs();
      setStatus({ type: 'ok', message: `Recalculated ${updated} rows` });
      load(0);
    } catch (err) {
      setStatus({ type: 'err', message: `Recalculate all failed: ${err.message}` });
    } finally {
      setRecalcAllBusy(false);
    }
  };

  return (
    <div className="batt-page" id="main-logs" style={{ display: 'block' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
        Log Management
      </div>

      <div className="chart-card">
        <div className="chart-hd">
          <div>
            <div className="chart-ttl" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Raw Sensor Log
              <span className="live-badge" title="Auto-refreshes every minute"><span className="live-dot" /> Live</span>
            </div>
            <div className="chart-sub">
              {total.toLocaleString()} readings{nodeFilter ? ` · ${nodeFilter}` : ''} — kPa/VWC/%AWC are computed from RADC using the current calibration constants
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="settings-input" style={{ width: 140 }} value={nodeFilter} onChange={(e) => setNodeFilter(e.target.value)}>
              <option value="">All sensors</option>
              {nodeIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
            {selectedIds.size > 0 ? (
              <button className="f-btn" onClick={handleBulkDelete} disabled={bulkDeleteBusy} style={{ color: '#b91c1c' }}>
                {bulkDeleteBusy ? 'Deleting…' : <><IconTrash size={12} /> Clear Selected ({selectedIds.size})</>}
              </button>
            ) : (
              <button className="f-btn" onClick={handleRecalculateAll} disabled={recalcAllBusy}>
                {recalcAllBusy ? 'Recalculating…' : 'Recalculate All'}
              </button>
            )}
            <a className="f-btn" href={buildExportUrl()} download>Export CSV</a>
          </div>
        </div>

        <div className="cc">
          {status && <div className={`settings-status ${status.type}`} style={{ marginBottom: 16 }}>{status.message}</div>}
          {error && <div className="settings-status err">Failed to load logs: {error}</div>}

          {loading && rows.length === 0 ? (
            <div className="node-table-empty">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="node-table-empty">No log rows yet</div>
          ) : (
            <>
              <div className="node-table-wrap">
                <table className="node-table">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>
                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} title="Select all loaded rows" />
                      </th>
                      {COLUMNS.map((col) => (
                        <th key={col.key}>
                          <button type="button" className="log-sort-btn" onClick={() => handleSort(col.key)}>
                            {col.label}
                            {sortKey === col.key && (
                              <IconChevronDown size={11} className={sortDir === 'asc' ? 'log-sort-asc' : undefined} />
                            )}
                          </button>
                        </th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className={selectedIds.has(row.id) ? 'row-selected' : undefined}>
                        <td>
                          <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelected(row.id)} />
                        </td>
                        <td>{formatDateTime(row.created_at)}</td>
                        <td style={{ fontWeight: 700 }}>{row.node_code}</td>
                        <td>{formatNumber(row.rst, 2)}</td>
                        <td>{row.radc ?? '—'}</td>
                        <td>{row.batt ?? '—'}</td>
                        <td>{row.badc ?? '—'}</td>
                        <td>{row.kpa != null ? formatNumber(row.kpa, 1) : '—'}</td>
                        <td>{row.vwc != null ? formatNumber(row.vwc, 4) : '—'}</td>
                        <td>{row.awc != null ? formatNumber(row.awc, 1) : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="f-btn" title="Recalculate" onClick={() => handleRecalculate(row)} disabled={busyId === row.id}>
                              <IconRefresh size={12} />
                            </button>
                            <button className="f-btn" title="Delete" onClick={() => handleDelete(row)} disabled={busyId === row.id}>
                              <IconTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length < total && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button className="f-btn" onClick={() => load(offset + PAGE_SIZE)} disabled={loading}>
                    {loading ? 'Loading…' : `Load more (${rows.length} of ${total})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
