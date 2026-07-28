import { Router } from 'express';
import { pool } from '../db/pool.js';

/**
 * Manual tensiometer readings for calibrating the Van Genuchten soil
 * parameters against a physical ground-truth measurement (dev_reference_
 * sensor_et_v1.md §4.4) — a field technician reads a tensiometer at a known
 * depth next to a sensor node and logs it here. Each entry is matched
 * against the sensor's own kPa at the closest point in time (LATERAL join,
 * not a stored snapshot, so a later Recalculate on Log Management is always
 * reflected) rather than requiring the tech to look up and copy a sensor
 * value by hand.
 */

const router = Router();

const LIST_QUERY = `
  SELECT t.id, t.node_id, n.node_code, t.depth_cm, t.reading_kpa, t.recorded_at, t.notes, t.created_at,
         m.kpa AS matched_kpa, m.vwc AS matched_vwc, m.awc AS matched_awc, m.recorded_at AS matched_at,
         EXTRACT(EPOCH FROM (t.recorded_at - m.recorded_at)) AS match_offset_seconds
  FROM tensiometer_readings t
  JOIN nodes n ON n.node_id = t.node_id
  LEFT JOIN LATERAL (
    SELECT kpa, vwc, awc, recorded_at
    FROM node_log nl
    WHERE nl.node_id = t.node_id
    ORDER BY ABS(EXTRACT(EPOCH FROM (nl.recorded_at - t.recorded_at)))
    LIMIT 1
  ) m ON true
`;

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`${LIST_QUERY} ORDER BY t.recorded_at DESC`);
    res.json({ rows });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  // The frontend only ever has node_code on hand (see soilNodes.js — node_id
  // never reaches the browser), so resolve by code here rather than asking
  // the client to know the numeric id. nodeId is still accepted for direct
  // API/curl use.
  const { nodeId, nodeCode, depthCm, readingKpa, recordedAt, notes } = req.body || {};
  const depth = Number(depthCm);
  const kpa = Number(readingKpa);

  if (!nodeId && !nodeCode) return res.status(400).json({ error: 'nodeId or nodeCode is required' });
  if (!Number.isFinite(depth)) return res.status(400).json({ error: 'depthCm must be a number' });
  if (!Number.isFinite(kpa)) return res.status(400).json({ error: 'readingKpa must be a number' });
  const recordedDate = recordedAt ? new Date(recordedAt) : new Date();
  if (Number.isNaN(recordedDate.getTime())) return res.status(400).json({ error: 'recordedAt is not a valid date' });

  try {
    const lookupCol = nodeCode ? 'node_code' : 'node_id';
    const lookupVal = nodeCode || Number(nodeId);
    const { rows: nodeRows } = await pool.query(`SELECT node_id FROM nodes WHERE ${lookupCol} = $1`, [lookupVal]);
    if (nodeRows.length === 0) return res.status(400).json({ error: `Unknown node (${lookupCol}=${lookupVal})` });

    const { rows } = await pool.query(
      `INSERT INTO tensiometer_readings (node_id, depth_cm, reading_kpa, recorded_at, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [nodeRows[0].node_id, depth, kpa, recordedDate.toISOString(), notes || null]
    );
    const { rows: full } = await pool.query(`${LIST_QUERY} WHERE t.id = $1`, [rows[0].id]);
    res.status(201).json({ ok: true, row: full[0] });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = await pool.query('DELETE FROM tensiometer_readings WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: `no tensiometer reading with id ${id}` });
  res.json({ ok: true });
});

function csvField(v) {
  if (v == null) return '';
  const str = v instanceof Date ? v.toISOString() : String(v);
  return `"${str.replace(/"/g, '""')}"`;
}

router.get('/export.csv', async (_req, res) => {
  try {
    const { rows } = await pool.query(`${LIST_QUERY} ORDER BY t.recorded_at DESC`);
    const header = ['id', 'node_code', 'depth_cm', 'reading_kpa', 'recorded_at', 'matched_kpa', 'matched_at', 'match_offset_seconds', 'notes'];
    const lines = [header.join(',')];
    for (const r of rows) lines.push(header.map((col) => csvField(r[col])).join(','));
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="tensiometer-calibration.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
