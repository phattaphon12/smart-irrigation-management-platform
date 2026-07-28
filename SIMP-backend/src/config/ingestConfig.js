import { pool } from '../db/pool.js';

/**
 * Runtime-editable "what kind of data is coming in right now" switch —
 * stamped onto every new `log` row at ingest time (see routes/ingest.js) so
 * bench-test readings never get silently mixed into real field data once
 * sensors are actually deployed. Same one-global-row pattern as
 * calibrationConfig.js / cropConfig.js.
 */

export const DATA_SOURCES = ['field', 'bench', 'demo'];

async function load() {
  const { rows } = await pool.query('SELECT * FROM ingest_config WHERE id = 1');
  return rows[0];
}

let cache = await load();

export function getIngestConfig() {
  return { ...cache };
}

export async function updateIngestConfig(patch) {
  if (patch.dataSource === undefined) return { ...cache };
  const { rows } = await pool.query(
    'UPDATE ingest_config SET data_source = $1 WHERE id = 1 RETURNING *',
    [patch.dataSource]
  );
  cache = rows[0];
  return { ...cache };
}
