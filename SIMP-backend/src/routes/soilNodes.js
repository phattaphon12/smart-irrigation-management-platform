import { Router } from 'express';
import { pool } from '../db/pool.js';

/**
 * Serves soil sensor node data from simp-database (nodes + node_log tables),
 * reshaped into exactly what the frontend already expects (see
 * sugarcane-dashboard/src/data/mockSoilNodes.js for the shape this mirrors):
 *   { [nodeCode]: { timestamps, kpa, vwc, awc, meta: { depth, treatment, position, status, flagged, battery } } }
 *
 * `nodes.node_id` is a SERIAL surrogate key (int) used for FKs — the human-facing
 * id ("Node_001") lives in `nodes.node_code` and is what keys the response object
 * and what log/node_log rows are joined back to via node_id.
 *
 * node_log already stores computed kPa/VWC/%AWC when something has processed it;
 * the ADC->kPa conversion itself only matters for *raw* readings landing in the
 * `log` table via POST /api/ingest/log (see routes/ingest.js), which nothing
 * processes into node_log yet.
 */

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows: nodeRows } = await pool.query(
      'SELECT node_id, node_code, depth, treatment, position, status, flagged FROM nodes ORDER BY node_code'
    );
    const { rows: logRows } = await pool.query(
      // recorded_at is stored as timestamptz (UTC instant) — AT TIME ZONE 'Asia/Bangkok'
      // shifts it to Bangkok wall-clock time before formatting, so a reading taken at
      // e.g. 2026-07-27 01:00 Bangkok (= 2026-07-26 18:00 UTC) lands on the correct
      // calendar day. Keeping HH24:MI:SS (not truncating to just the date) matters
      // once readings come in more than once a day — truncating to date collapses
      // every same-day reading onto one timestamps[] entry, silently dropping all but
      // the last one for that day.
      `SELECT node_id, kpa, vwc, awc, battery, to_char(recorded_at AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD"T"HH24:MI:SS') AS date
       FROM node_log ORDER BY node_id, recorded_at ASC`
    );

    const result = {};
    const codeById = new Map();
    for (const n of nodeRows) {
      codeById.set(n.node_id, n.node_code);
      result[n.node_code] = {
        timestamps: [],
        kpa: [],
        vwc: [],
        awc: [],
        meta: {
          depth: n.depth,
          treatment: n.treatment,
          position: n.position || '',
          status: n.status,
          flagged: n.flagged,
          battery: null, // filled in below from the most recent node_log row
        },
      };
    }

    for (const r of logRows) {
      const code = codeById.get(r.node_id);
      const node = code && result[code];
      if (!node) continue; // node_log row referencing a node no longer in `nodes`
      node.timestamps.push(r.date);
      node.kpa.push(r.kpa);
      node.vwc.push(r.vwc);
      node.awc.push(r.awc);
      if (r.battery != null) node.meta.battery = r.battery; // rows are ascending -> last write wins = most recent
    }

    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
