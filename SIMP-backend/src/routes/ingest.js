import { Router } from 'express';
import { pool } from '../db/pool.js';
import { adcToAll } from '../lib/soilMoisture.js';

/**
 * Receives raw sensor readings pushed by Node-RED, in the same JSON shape the
 * ESP32-H2 firmware itself builds (see the node's snprintf format string):
 *   { "node_id": 10, "RST": 60.00, "RADC": 2032, "BATT": 87.00, "BADC": 3123 }
 * and lands them in the `log` table (raw ADC). Immediately after, RADC is run
 * through the Watermark/Shock-Seddigh/Van-Genuchten pipeline (adcToAll, §3 of
 * dev_reference_sensor_et_v1.md) and the result is written to `node_log` too,
 * so the dashboard (which reads node_log via GET /api/soil-nodes) sees the new
 * reading right away — no separate batch/cron processing step needed.
 *
 * The incoming node_id is normally the bare integer that IS `nodes.node_id`
 * (the surrogate PK — matches what Node-RED sends and what the Add Node form's
 * "Node ID" field sets). A non-numeric string is also accepted as a fallback,
 * matched against `nodes.node_code` instead (e.g. if something ever sends
 * "Node_01" directly rather than the id 1) — see resolveNodeLookup().
 */

const router = Router();

function numOrNull(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function resolveNodeLookup(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { column: 'node_id', value: raw };
  }
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    return /^\d+$/.test(trimmed) ? { column: 'node_id', value: Number(trimmed) } : { column: 'node_code', value: trimmed };
  }
  return null;
}

router.post('/log', async (req, res) => {
  const { node_id: rawNodeId, RST, RADC, BATT, BADC } = req.body || {};
  const lookup = resolveNodeLookup(rawNodeId);

  if (!lookup) {
    return res.status(400).json({ error: 'node_id (number, e.g. 1) or node_code (string, e.g. "Node_01") is required' });
  }

  try {
    const { rows: nodeRows } = await pool.query(`SELECT node_id FROM nodes WHERE ${lookup.column} = $1`, [lookup.value]);
    if (nodeRows.length === 0) {
      return res.status(400).json({ error: `Unknown node (${lookup.column}=${lookup.value}) — add it to the nodes table first` });
    }

    const nodeId = nodeRows[0].node_id;
    const radc = numOrNull(RADC);
    const batt = numOrNull(BATT);

    const { rows } = await pool.query(
      `INSERT INTO log (node_id, rst, radc, batt, badc, created_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING id, created_at`,
      [nodeId, numOrNull(RST), radc, batt, numOrNull(BADC)]
    );
    const { created_at: recordedAt } = rows[0];

    const { kpa, vwc, awc } = adcToAll(radc);
    let nodeLogId = null;
    if (kpa != null || batt != null) {
      const { rows: nodeLogRows } = await pool.query(
        `INSERT INTO node_log (node_id, kpa, vwc, awc, battery, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [nodeId, kpa, vwc, awc, batt, recordedAt]
      );
      nodeLogId = nodeLogRows[0].id;
    }

    res.status(201).json({ ok: true, id: rows[0].id, node_log_id: nodeLogId, created_at: recordedAt, kpa, vwc, awc });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
