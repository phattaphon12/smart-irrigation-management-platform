import { Router } from 'express';
import { pool } from '../db/pool.js';

/**
 * Downlink command queue — see the comment above POST /:node_id/downlink in
 * routes/nodes.js for why this is pull (Node-RED polls us) rather than push
 * (us calling Node-RED): Node-RED runs on the LoRa gateway's local network,
 * behind a router with a dynamic IP only reachable from the same LAN, so this
 * backend (a public server) can't call it directly.
 */

const router = Router();

// Node-RED polls this on an interval to pick up queued commands. eui is used
// to address the downlink when set on the node; boardID (our node_id) is the
// fallback, since it's always present and is the same id ingest.js already
// keys uplinks on.
router.get('/pending', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT dc.id, dc.command, dc.value, dc.created_at, n.node_id, n.node_code, n.eui
       FROM downlink_commands dc
       JOIN nodes n ON n.node_id = dc.node_id
       WHERE dc.status = 'pending'
       ORDER BY dc.created_at ASC`
    );
    const commands = rows.map((r) => ({
      id: r.id,
      command: r.command,
      value: r.value,
      node_code: r.node_code,
      created_at: r.created_at,
      ...(r.eui ? { eui: r.eui } : { boardID: r.node_id }),
    }));
    res.json({ commands });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Node-RED calls this once it's actually sent the downlink (or given up on
// it) — { ok: true } marks it sent, { ok: false, error } marks it failed so
// the Settings page can show why.
router.post('/:id/ack', async (req, res) => {
  const id = Number(req.params.id);
  const { ok, error } = req.body || {};
  const status = ok === false ? 'failed' : 'sent';

  try {
    const { rows } = await pool.query(
      `UPDATE downlink_commands SET status = $1, sent_at = now(), error = $2
       WHERE id = $3 AND status = 'pending' RETURNING id`,
      [status, error ? String(error) : null, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `no pending downlink command with id ${id}` });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Recent command history (optionally filtered to one node) — lets the
// Settings page show whether a queued command has actually gone out yet.
router.get('/', async (req, res) => {
  const nodeId = req.query.node_id ? Number(req.query.node_id) : null;
  try {
    const { rows } = await pool.query(
      `SELECT dc.id, dc.node_id, n.node_code, dc.command, dc.value, dc.status, dc.created_at, dc.sent_at, dc.error
       FROM downlink_commands dc
       JOIN nodes n ON n.node_id = dc.node_id
       ${nodeId ? 'WHERE dc.node_id = $1' : ''}
       ORDER BY dc.created_at DESC
       LIMIT 100`,
      nodeId ? [nodeId] : []
    );
    res.json({ rows });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
