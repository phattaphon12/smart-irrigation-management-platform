import { useEffect, useRef, useState } from 'react';
import {
  fetchLogs, deleteLog, restoreLog, bulkDeleteLogs, bulkRestoreLogs,
  clearAllLogs, restoreAllLogs, recalculateLog, recalculateAllLogs, buildExportUrl,
} from '../lib/api/logsClient';
import { formatDateTime, formatNumber } from '../utils/formatters';
import { IconTrash, IconRestore, IconRefresh, IconChevronDown, IconWarning } from '../components/icons/Icons';

const PAGE_SIZE = 50;
const POLL_MS = 60000; // dashboard refresh rate — sensors themselves report every ~15 min, this just picks up new rows quickly once they land

const SOURCE_LABEL = { field: 'Field', bench: 'Bench', demo: 'Demo' };
const SOURCE_BADGE_CLASS = { field: 'bdg-ok', bench: 'bdg-warn', demo: 'bdg-info' };

const COLUMNS = [
  { key: 'created_at', label: 'Timestamp' },
  { key: 'node_code', label: 'Sensor' },
  { key: 'data_source', label: 'Source', title: 'Bench test / field / demo — set on the Settings page, stamped onto readings as they arrive. Not sortable.' },
  { key: 'rst', label: 'RST', title: 'Resistance (Ω) computed on-device by the sensor firmware — reported for reference only. Not used by this app’s own kPa/VWC/%AWC pipeline (which derives resistance from RADC instead), so small differences from that recomputed value are expected and not a bug.' },
  { key: 'radc', label: 'RADC' },
  { key: 'batt', label: 'BATT' },
  { key: 'badc', label: 'BADC' },
  { key: 'kpa', label: 'kPa' },
  { key: 'vwc', label: 'VWC' },
  { key: 'awc', label: '%AWC' },
];

// adcToAll() (backend) only returns null kPa/VWC/%AWC when RADC fell outside
// the sensor's valid range (open circuit / firmware glitch) — so a null kPa
// here always means "this reading was discarded as bad," never "not yet
// computed." Reuse that instead of re-deriving our own RST/RADC thresholds.
function isInvalidReading(row) {
  return row.kpa == null;
}

export default function LogManagementPage({ nodeIds }) {
  const [nodeFilter, setNodeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
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
  const [clearAllBusy, setClearAllBusy] = useState(false);
  const [restoreAllBusy, setRestoreAllBusy] = useState(false);
  const [bulkActionBusy, setBulkActionBusy] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [status, setStatus] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const load = (nextOffset = 0) => {
    setLoading(true);
    fetchLogs({ nodeCode: nodeFilter || undefined, limit: PAGE_SIZE, offset: nextOffset, sort: sortKey, dir: sortDir, includeDeleted: showDeleted, source: sourceFilter || undefined })
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
  }, [nodeFilter, sourceFilter, sortKey, sortDir, showDeleted]);

  // Background auto-refresh — re-fetches the same window the user has
  // already loaded (not just the first page, so "Load more" progress isn't
  // lost) and swaps it in silently. A failed poll just keeps showing the
  // last-known-good rows instead of surfacing an error banner.
  const rowsLengthRef = useRef(0);
  rowsLengthRef.current = rows.length;

  useEffect(() => {
    const id = setInterval(() => {
      const windowSize = Math.max(rowsLengthRef.current, PAGE_SIZE);
      fetchLogs({ nodeCode: nodeFilter || undefined, limit: windowSize, offset: 0, sort: sortKey, dir: sortDir, includeDeleted: showDeleted, source: sourceFilter || undefined })
        .then(({ rows: r, total: t }) => {
          setRows(r);
          setTotal(t);
        })
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [nodeFilter, sourceFilter, sortKey, sortDir, showDeleted]);

  const handleSort = (key) => {
    if (key === 'data_source') return; // backend can't sort by this — column exists for display/filtering only
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

  // Deletes are soft (see routes/logs.js) — a deleted row just gets marked
  // and hidden by default, never actually erased, so this doubles as the
  // restore action once "Show Deleted" is on and the row already has deleted=true.
  const handleDelete = async (row) => {
    const restoring = !!row.deleted;
    if (!window.confirm(`${restoring ? 'Restore' : 'Delete'} this reading from ${row.node_code} at ${formatDateTime(row.created_at)}?`)) return;
    setBusyId(row.id);
    try {
      if (restoring) await restoreLog(row.id);
      else await deleteLog(row.id);

      if (showDeleted) {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, deleted: !restoring } : r)));
      } else {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        setTotal((t) => t - 1);
      }
      setSelectedIds((prev) => {
        if (!prev.has(row.id)) return prev;
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    } catch (err) {
      setStatus({ type: 'err', message: `${restoring ? 'Restore' : 'Delete'} failed: ${err.message}` });
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected reading${ids.length === 1 ? '' : 's'}? You can undo this later from "Show Deleted".`)) return;
    setBulkActionBusy(true);
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
      setBulkActionBusy(false);
    }
  };

  const handleBulkRestore = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkActionBusy(true);
    setStatus(null);
    try {
      const { restored } = await bulkRestoreLogs(ids);
      setRows((prev) => prev.map((r) => (selectedIds.has(r.id) ? { ...r, deleted: false } : r)));
      setSelectedIds(new Set());
      setStatus({ type: 'ok', message: `Restored ${restored} row${restored === 1 ? '' : 's'}` });
    } catch (err) {
      setStatus({ type: 'err', message: `Restore selected failed: ${err.message}` });
    } finally {
      setBulkActionBusy(false);
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

  const handleClearAll = async () => {
    if (!window.confirm(`Delete ALL ${total.toLocaleString()} log rows from every sensor? You can undo this from "Show Deleted".`)) return;
    setClearAllBusy(true);
    setStatus(null);
    try {
      const { deleted } = await clearAllLogs();
      setStatus({ type: 'ok', message: `Cleared all log data — ${deleted.toLocaleString()} rows marked deleted (restorable via "Show Deleted")` });
      load(0);
    } catch (err) {
      setStatus({ type: 'err', message: `Clear all failed: ${err.message}` });
    } finally {
      setClearAllBusy(false);
    }
  };

  const handleRestoreAll = async () => {
    if (!window.confirm(`Restore all deleted log rows?`)) return;
    setRestoreAllBusy(true);
    setStatus(null);
    try {
      const { restored } = await restoreAllLogs();
      setStatus({ type: 'ok', message: `Restored ${restored.toLocaleString()} rows` });
      load(0);
    } catch (err) {
      setStatus({ type: 'err', message: `Restore all failed: ${err.message}` });
    } finally {
      setRestoreAllBusy(false);
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
            <div className="chart-sub">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#b91c1c' }}>
                <IconWarning size={11} />Rows highlighted in red had an out-of-range RADC (sensor fault/open circuit) — kept for reference, but kPa/VWC/%AWC are intentionally left blank
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="settings-input" style={{ width: 140 }} value={nodeFilter} onChange={(e) => setNodeFilter(e.target.value)}>
              <option value="">All sensors</option>
              {nodeIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
            <select className="settings-input" style={{ width: 120 }} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="">All sources</option>
              <option value="field">Field</option>
              <option value="bench">Bench</option>
              <option value="demo">Demo</option>
            </select>
            <button className={`f-btn${showDeleted ? ' active' : ''}`} onClick={() => setShowDeleted((s) => !s)}>
              {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
            </button>
            {selectedIds.size > 0 ? (
              showDeleted ? (
                <button className="f-btn" onClick={handleBulkRestore} disabled={bulkActionBusy}>
                  {bulkActionBusy ? 'Restoring…' : <><IconRestore size={12} /> Restore Selected ({selectedIds.size})</>}
                </button>
              ) : (
                <button className="f-btn" onClick={handleBulkDelete} disabled={bulkActionBusy} style={{ color: '#b91c1c' }}>
                  {bulkActionBusy ? 'Deleting…' : <><IconTrash size={12} /> Clear Selected ({selectedIds.size})</>}
                </button>
              )
            ) : (
              <button className="f-btn" onClick={handleRecalculateAll} disabled={recalcAllBusy}>
                {recalcAllBusy ? 'Recalculating…' : 'Recalculate All'}
              </button>
            )}
            <a className="f-btn" href={buildExportUrl()} download>Export CSV</a>
            {showDeleted ? (
              <button className="f-btn" onClick={handleRestoreAll} disabled={restoreAllBusy || total === 0}>
                {restoreAllBusy ? 'Restoring…' : <><IconRestore size={12} /> Restore All</>}
              </button>
            ) : (
              <button className="f-btn" onClick={handleClearAll} disabled={clearAllBusy || total === 0} style={{ color: '#b91c1c' }} title="Delete every log row, not just what's loaded on this page — soft delete, recoverable via Show Deleted">
                {clearAllBusy ? 'Clearing…' : <><IconTrash size={12} /> Clear All Data</>}
              </button>
            )}
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
                        <th key={col.key} title={col.title}>
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
                    {rows.map((row) => {
                      const invalid = isInvalidReading(row);
                      return (
                      <tr
                        key={row.id}
                        className={[selectedIds.has(row.id) && 'row-selected', invalid && 'row-invalid', row.deleted && 'row-deleted'].filter(Boolean).join(' ') || undefined}
                      >
                        <td>
                          <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelected(row.id)} />
                        </td>
                        <td>{formatDateTime(row.created_at)}{row.deleted && <span className="bdg bdg-crit" style={{ marginLeft: 6 }}>Deleted</span>}</td>
                        <td style={{ fontWeight: 700 }}>{row.node_code}</td>
                        <td><span className={`bdg ${SOURCE_BADGE_CLASS[row.data_source] || 'bdg'}`}>{SOURCE_LABEL[row.data_source] || row.data_source}</span></td>
                        <td className={invalid ? 'cell-invalid' : undefined} title={invalid ? 'Sensor fault — RADC was outside the valid range for this reading' : undefined}>
                          {invalid && <IconWarning size={10} />}{formatNumber(row.rst, 2)}
                        </td>
                        <td className={invalid ? 'cell-invalid' : undefined} title={invalid ? 'Below the sensor’s valid ADC range — treated as an open circuit' : undefined}>
                          {invalid && <IconWarning size={10} />}{row.radc ?? '—'}
                        </td>
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
                            {row.deleted ? (
                              <button className="f-btn" title="Restore" onClick={() => handleDelete(row)} disabled={busyId === row.id}>
                                <IconRestore size={12} />
                              </button>
                            ) : (
                              <button className="f-btn" title="Delete" onClick={() => handleDelete(row)} disabled={busyId === row.id}>
                                <IconTrash size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
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
