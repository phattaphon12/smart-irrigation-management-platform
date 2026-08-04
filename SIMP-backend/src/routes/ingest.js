import { Router } from 'express';
import { pool } from '../db/pool.js';
import { adcToAll } from '../lib/soilMoisture.js';
import { getIngestConfig } from '../config/ingestConfig.js';

/**
 * Receives raw sensor readings pushed by Node-RED, in the same JSON shape the
 * ESP32-H2 firmware itself builds (see the node's snprintf format string),
 * plus RSSI which Node-RED adds itself from the LoRaWAN uplink metadata
 * (not something the sensor firmware reports):
 *   { "node_id": 3, "RSSI": -91, "RST": 12255.43, "RADC": 1840, "BATT": 82, "BADC": 561 }
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
  const { node_id: rawNodeId, RSSI, RST, RADC, BATT, BADC } = req.body || {};
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

    // data_source is stamped from the current global ingest setting (Settings
    // page), not sent by the device — lets the team flip "bench" -> "field"
    // once sensors go into real ground, without touching firmware (§4.2).
    const { data_source: dataSource } = getIngestConfig();
    const { rows } = await pool.query(
      `INSERT INTO log (node_id, rssi, rst, radc, batt, badc, data_source, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       RETURNING id, created_at`,
      [nodeId, numOrNull(RSSI), numOrNull(RST), radc, batt, numOrNull(BADC), dataSource]
    );
    const logId = rows[0].id;
    const recordedAt = rows[0].created_at;

    const { kpa, vwc, awc } = adcToAll(radc);
    let nodeLogId = null;
    if (kpa != null || batt != null) {
      // recorded_at is copied server-side from log.created_at (via subquery,
      // not the JS Date in `recordedAt` above) so the two stay byte-exact —
      // `now()` has microsecond precision in Postgres but a JS Date only
      // keeps milliseconds, so round-tripping it back through a parameter
      // would silently truncate and break any later exact-timestamp join
      // between log and node_log (see routes/logs.js).
      const { rows: nodeLogRows } = await pool.query(
        `INSERT INTO node_log (node_id, kpa, vwc, awc, battery, recorded_at)
         SELECT $1, $2, $3, $4, $5, created_at FROM log WHERE id = $6
         RETURNING id`,
        [nodeId, kpa, vwc, awc, batt, logId]
      );
      nodeLogId = nodeLogRows[0].id;
    }

    res.status(201).json({ ok: true, id: rows[0].id, node_log_id: nodeLogId, created_at: recordedAt, kpa, vwc, awc });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
