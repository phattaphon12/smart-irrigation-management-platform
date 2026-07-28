import { pool } from '../db/pool.js';

/**
 * Runtime-editable crop cycle config (planting/cutting date + crop type) used
 * to compute DAP -> Kc -> ETc (see SIMP-dashboard/src/lib/calculations/cropWaterUse.js).
 * One global row in crop_config, cached in memory and refreshed on write —
 * same pattern as calibrationConfig.js.
 */

export const CROP_TYPES = ['plantCrop', 'ratoon'];

// planting_date is a DATE column — select it via to_char rather than letting
// node-postgres hand back a JS Date, which would shift by the server's UTC
// offset and silently change the calendar date (e.g. 2026-01-01 -> Dec 31).
const SELECT_QUERY = `SELECT id, to_char(planting_date, 'YYYY-MM-DD') AS planting_date, crop_type, updated_at FROM crop_config WHERE id = 1`;

async function load() {
  const { rows } = await pool.query(SELECT_QUERY);
  return rows[0];
}

let cache = await load();

export function getCropConfig() {
  return { ...cache };
}

export async function updateCropConfig(patch) {
  const setFields = [];
  const values = [];
  if (patch.plantingDate !== undefined) {
    setFields.push(`planting_date = $${setFields.length + 1}`);
    values.push(patch.plantingDate);
  }
  if (patch.cropType !== undefined) {
    setFields.push(`crop_type = $${setFields.length + 1}`);
    values.push(patch.cropType);
  }
  if (setFields.length === 0) return { ...cache };

  await pool.query(`UPDATE crop_config SET ${setFields.join(', ')} WHERE id = 1`, values);
  cache = await load();
  return { ...cache };
}
