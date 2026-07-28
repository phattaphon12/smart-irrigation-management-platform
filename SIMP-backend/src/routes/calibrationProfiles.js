import { Router } from 'express';
import { pool } from '../db/pool.js';
import { getCalibrationConfig, updateCalibrationConfig, CALIBRATION_FIELDS } from '../config/calibrationConfig.js';
import { getCropConfig, updateCropConfig } from '../config/cropConfig.js';

/**
 * Named snapshots of calibration_config + crop_config — lets the team save
 * the current soil/crop settings under a name (e.g. "Sa Bua Kam - Apr 2026")
 * before overwriting them to calibrate for a different plot, then load an
 * old snapshot back later without having lost it (dev_reference_sensor_et_v1.md
 * §4.3's stated risk: "move to a new plot, overwrite the values, and Sa Bua
 * Kam's calibration is gone"). Deliberately not a full multi-site system
 * (no separate node/weather-station assignment per site) — there's only one
 * active site right now, so this solves the actual stated problem without
 * the much larger schema a real multi-tenant site model would need.
 */

const router = Router();

// planting_date is a DATE column — always select it via to_char. node-postgres's
// default date parser builds the JS Date at LOCAL midnight, and .toISOString()
// (or JSON-serializing it) then converts back to UTC, silently shifting the
// calendar date by the server's UTC offset (e.g. 2026-01-01 -> Dec 31 in ICT).
// Same issue already fixed once in config/cropConfig.js — same fix needed here.
const SELECT_LIST = `id, name, notes, to_char(planting_date, 'YYYY-MM-DD') AS planting_date, crop_type, created_at`;

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${SELECT_LIST} FROM calibration_profiles ORDER BY created_at DESC`
    );
    res.json({ rows });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, notes } = req.body || {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const cal = getCalibrationConfig();
    const crop = getCropConfig();
    const fields = ['name', 'notes', ...CALIBRATION_FIELDS, 'planting_date', 'crop_type'];
    const values = [
      name.trim(),
      notes || null,
      ...CALIBRATION_FIELDS.map((f) => cal[f]),
      crop.planting_date,
      crop.crop_type,
    ];
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO calibration_profiles (${fields.join(', ')}) VALUES (${placeholders}) RETURNING id`,
      values
    );
    const { rows: full } = await pool.query(`SELECT ${SELECT_LIST} FROM calibration_profiles WHERE id = $1`, [rows[0].id]);
    res.status(201).json({ ok: true, profile: full[0] });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post('/:id/load', async (req, res) => {
  const id = Number(req.params.id);
  try {
    // Still need the raw (non-to_char) numeric columns here for calPatch, so
    // this query stays SELECT * — only planting_date needs the to_char guard,
    // fetched separately via SELECT_LIST.
    const { rows } = await pool.query('SELECT * FROM calibration_profiles WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: `no profile with id ${id}` });
    const profile = rows[0];
    const { rows: dateRows } = await pool.query(`SELECT to_char(planting_date, 'YYYY-MM-DD') AS planting_date FROM calibration_profiles WHERE id = $1`, [id]);

    const calPatch = {};
    for (const f of CALIBRATION_FIELDS) calPatch[f] = profile[f];
    await updateCalibrationConfig(calPatch);

    await updateCropConfig({ plantingDate: dateRows[0].planting_date, cropType: profile.crop_type });

    res.json({ ok: true, calibration: getCalibrationConfig(), crop: getCropConfig() });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = await pool.query('DELETE FROM calibration_profiles WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: `no profile with id ${id}` });
  res.json({ ok: true });
});

export default router;
