import { pool } from '../db/pool.js';

/**
 * Runtime-editable soil-moisture calibration constants (ADC->kPa->VWC->%AWC
 * pipeline, see ../lib/soilMoisture.js) — one global row in calibration_config,
 * cached in memory and refreshed on write, mirroring the ambientConfig.js
 * pattern but Postgres-backed instead of file-backed since everything else
 * soil-related already lives in Postgres.
 */

export const CALIBRATION_FIELDS = [
  'r_divider_kohm',
  'adc_max',
  'adc_valid_min',
  'ss_a',
  'ss_b',
  'ss_c',
  'ss_d',
  'assumed_soil_temp_c',
  'kpa_clip_min',
  'vg_theta_r',
  'vg_theta_s',
  'vg_alpha',
  'vg_n',
  'wilting_point_vwc',
  'available_water_capacity',
];

async function load() {
  const { rows } = await pool.query('SELECT * FROM calibration_config WHERE id = 1');
  return rows[0];
}

// Top-level await — Node ESM supports it, so the cache is warm before any
// route/ingest can read it.
let cache = await load();

export function getCalibrationConfig() {
  return { ...cache };
}

export async function updateCalibrationConfig(patch) {
  const setFields = CALIBRATION_FIELDS.filter((f) => patch[f] !== undefined);
  if (setFields.length === 0) return { ...cache };

  const setClause = setFields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = setFields.map((f) => patch[f]);
  const { rows } = await pool.query(
    `UPDATE calibration_config SET ${setClause} WHERE id = 1 RETURNING *`,
    values
  );
  cache = rows[0];
  return { ...cache };
}
