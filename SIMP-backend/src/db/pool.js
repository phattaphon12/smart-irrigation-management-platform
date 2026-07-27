import pg from 'pg';

/**
 * Connection pool for simp-database (Postgres, docker-compose) — soil sensor
 * node data (nodes / node_log / log tables). Reused by routes/soilNodes.js
 * (read) and routes/ingest.js (write, from Node-RED).
 */
export const pool = new pg.Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

// An idle client erroring out (e.g. DB restarted) would otherwise crash the
// whole process via an unhandled 'error' event — log it and keep serving.
pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error:', err.message);
});
