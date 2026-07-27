import { Router } from 'express';
import { pool } from '../db/pool.js';
import { adcToAll } from '../lib/soilMoisture.js';

/**
 * Raw sensor log management — list/delete/recalculate/export the `log` table
 * (raw ADC readings from POST /api/ingest/log) alongside their derived
 * node_log values, for the Log Management page. "Recalculate" re-runs
 * adcToAll() with whatever calibration_config currently holds (see
 * ../config/calibrationConfig.js), so editing a constant on the Settings page
 * only reaches historical rows once this is triggered — new ingests already
 * pick it up immediately.
 */

const router = Router();

const LIST_QUERY = `
  SELECT l.id, l.node_id, n.node_code, l.rst, l.radc, l.batt, l.badc, l.created_at,
         nl.id AS node_log_id, nl.kpa, nl.vwc, nl.awc
  FROM log l
  JOIN nodes n ON n.node_id = l.node_id
  LEFT JOIN node_log nl ON nl.node_id = l.node_id AND nl.recorded_at = l.created_at
`;

// Whitelist of client-sortable columns -> actual SQL column, so `sort` can't
// be used to inject arbitrary SQL via the query string.
const SORTABLE_COLUMNS = {
  created_at: 'l.created_at',
  node_code: 'n.node_code',
  rst: 'l.rst',
  radc: 'l.radc',
  batt: 'l.batt',
  badc: 'l.badc',
  kpa: 'nl.kpa',
  vwc: 'nl.vwc',
  awc: 'nl.awc',
};

router.get('/', async (req, res) => {
  // node_code (e.g. "Node_01") is what the frontend's node picker actually has
  // on hand (see soilNodes.js — it never exposes the numeric node_id to the
  // browser); node_id is also accepted for direct API/curl use.
  const nodeCode = req.query.node_code || null;
  const nodeId = req.query.node_id ? Number(req.query.node_id) : null;
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const offset = Number(req.query.offset) || 0;
  const sortCol = SORTABLE_COLUMNS[req.query.sort] || SORTABLE_COLUMNS.created_at;
  const sortDir = req.query.dir === 'asc' ? 'ASC' : 'DESC';

  const filterCol = nodeCode ? 'n.node_code' : nodeId ? 'l.node_id' : null;
  const filterVal = nodeCode || nodeId;
  const where = filterCol ? `WHERE ${filterCol} = $1` : '';
  const params = filterCol ? [filterVal, limit, offset] : [limit, offset];
  const limitParam = filterCol ? '$2' : '$1';
  const offsetParam = filterCol ? '$3' : '$2';

  try {
    const { rows } = await pool.query(
      `${LIST_QUERY} ${where} ORDER BY ${sortCol} ${sortDir} NULLS LAST, l.id ${sortDir} LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );
    const { rows: countRows } = await pool.query(
      `SELECT count(*) FROM log l JOIN nodes n ON n.node_id = l.node_id ${filterCol ? `WHERE ${filterCol} = $1` : ''}`,
      filterCol ? [filterVal] : []
    );
    res.json({ rows, total: Number(countRows[0].count) });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// recorded_at is looked up via a subquery against log.id (not a JS Date
// value) so it matches node_log to microsecond precision — see the note in
// ingest.js about why a JS-Date round-trip would truncate and miss.
async function deleteLogRow(client, id) {
  const { rows } = await client.query('SELECT node_id FROM log WHERE id = $1', [id]);
  if (rows.length === 0) return false;
  await client.query(
    `DELETE FROM node_log WHERE node_id = $1 AND recorded_at = (SELECT created_at FROM log WHERE id = $2)`,
    [rows[0].node_id, id]
  );
  await client.query('DELETE FROM log WHERE id = $1', [id]);
  return true;
}

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await deleteLogRow(client, id);
    if (!found) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `no log row with id ${id}` });
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(502).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Bulk "Clear data" action for the Log Management table's row-selection UI.
router.post('/bulk-delete', async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isFinite) : [];
  if (ids.length === 0) {
    return res.status(400).json({ error: 'ids (non-empty array of log row ids) is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let deleted = 0;
    for (const id of ids) {
      if (await deleteLogRow(client, id)) deleted += 1;
    }
    await client.query('COMMIT');
    res.json({ ok: true, deleted });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(502).json({ error: err.message });
  } finally {
    client.release();
  }
});

async function recalculateRow(client, logRow) {
  const { kpa, vwc, awc } = adcToAll(logRow.radc);
  // Same precision concern as ingest.js/DELETE above — recorded_at comes from
  // a subquery against log.id, not the JS-Date `logRow.created_at`.
  await client.query(
    `INSERT INTO node_log (node_id, kpa, vwc, awc, battery, recorded_at)
     SELECT $1, $2, $3, $4, $5, created_at FROM log WHERE id = $6
     ON CONFLICT (node_id, recorded_at) DO UPDATE SET kpa = EXCLUDED.kpa, vwc = EXCLUDED.vwc, awc = EXCLUDED.awc`,
    [logRow.node_id, kpa, vwc, awc, logRow.batt, logRow.id]
  );
  return { kpa, vwc, awc };
}

router.post('/:id/recalculate', async (req, res) => {
  const id = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id, node_id, radc, batt FROM log WHERE id = $1', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `no log row with id ${id}` });
    }
    const result = await recalculateRow(client, rows[0]);
    await client.query('COMMIT');
    res.json({ ok: true, ...result });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(502).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Loop of individual upserts is fine at the current (~100-row) scale; revisit
// with a batched unnest() insert if `log` grows into the tens of thousands.
router.post('/recalculate-all', async (_req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id, node_id, radc, batt FROM log');
    for (const row of rows) {
      await recalculateRow(client, row);
    }
    await client.query('COMMIT');
    res.json({ ok: true, updated: rows.length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(502).json({ error: err.message });
  } finally {
    client.release();
  }
});

function csvField(v) {
  if (v == null) return '';
  const str = v instanceof Date ? v.toISOString() : String(v);
  return `"${str.replace(/"/g, '""')}"`;
}

router.get('/export.csv', async (_req, res) => {
  try {
    const { rows } = await pool.query(`${LIST_QUERY} ORDER BY l.created_at DESC`);
    const header = ['id', 'node_id', 'node_code', 'rst', 'radc', 'batt', 'badc', 'created_at', 'kpa', 'vwc', 'awc'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push(header.map((col) => csvField(r[col])).join(','));
    }
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="sensor-logs.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
