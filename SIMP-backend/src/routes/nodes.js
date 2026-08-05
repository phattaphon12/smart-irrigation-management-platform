import { Router } from 'express';
import { pool } from '../db/pool.js';

/**
 * Registers/records a sensor node's metadata (nodes table) — e.g. from a
 * provisioning flow that knows the node's LoRaWAN identifiers (eui, dev_addr)
 * and physical board_serial at commissioning time, alongside the usual
 * depth/treatment/position fields.
 */

const router = Router();

// GET /api/nodes — full metadata for every registered node, active and inactive
// (the Settings page needs both, to manage/restore soft-deleted ones — the live
// dashboard's node picker instead reads GET /api/soil-nodes, which filters to
// active only)
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT node_id, node_code, name, depth, treatment, position, status, flagged, active, eui, dev_addr, board_serial, created_at, updated_at
       FROM nodes ORDER BY node_code`
    );
    res.json(rows);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

function strOrNull(v) {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed ? trimmed : null;
}

const DUPLICATE_FIELD_BY_CONSTRAINT = {
  nodes_pkey: 'node_id',
  nodes_node_code_key: 'node_code',
  uq_nodes_eui: 'eui',
  uq_nodes_dev_addr: 'dev_addr',
  uq_nodes_board_serial: 'board_serial',
};

router.post('/', async (req, res) => {
  const { node_id: rawNodeId, node_code, name, depth, treatment, position, status, flagged, eui, dev_addr, board_serial } = req.body || {};

  const nodeCode = strOrNull(node_code);
  if (!nodeCode) {
    return res.status(400).json({ error: 'node_code (string) is required' });
  }

  // node_id has no DEFAULT/sequence in this schema — the caller must supply it
  const nodeId = Number(rawNodeId);
  if (rawNodeId == null || rawNodeId === '' || !Number.isInteger(nodeId) || nodeId <= 0) {
    return res.status(400).json({ error: 'node_id (positive integer) is required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO nodes (node_id, node_code, name, depth, treatment, position, status, flagged, eui, dev_addr, board_serial)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING node_id, node_code, name, depth, treatment, position, status, flagged, eui, dev_addr, board_serial, created_at, updated_at`,
      [
        nodeId,
        nodeCode,
        strOrNull(name),
        depth != null && depth !== '' ? Number(depth) : null,
        strOrNull(treatment),
        strOrNull(position),
        strOrNull(status),
        typeof flagged === 'boolean' ? flagged : false,
        strOrNull(eui),
        strOrNull(dev_addr),
        strOrNull(board_serial),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const field = DUPLICATE_FIELD_BY_CONSTRAINT[err.constraint] || 'a field';
      return res.status(409).json({ error: `${field} already in use by another node` });
    }
    if (err.code === '22001') {
      return res.status(400).json({ error: 'a field is too long for its column (node_code<=20, treatment<=20, position<=50, name/status<=100, eui<=16, dev_addr<=8, board_serial<=50)' });
    }
    res.status(502).json({ error: err.message });
  }
});

// node_id/node_code are immutable after creation (ingest.js and historical
// log/node_log rows key off them) — everything else, including `active`, is
// editable here. PUT { active: true } is also how a soft-deleted node is
// restored — there's no separate restore endpoint.
const EDITABLE_FIELDS = ['name', 'depth', 'treatment', 'position', 'status', 'flagged', 'active', 'eui', 'dev_addr', 'board_serial'];

router.put('/:node_id', async (req, res) => {
  const nodeId = Number(req.params.node_id);
  const body = req.body || {};

  const setFields = EDITABLE_FIELDS.filter((f) => body[f] !== undefined);
  if (setFields.length === 0) {
    return res.status(400).json({ error: 'no editable fields provided' });
  }

  const values = setFields.map((f) => {
    if (f === 'depth') return body.depth === '' ? null : Number(body.depth);
    if (f === 'flagged' || f === 'active') return !!body[f];
    return strOrNull(body[f]);
  });
  const setClause = setFields.map((f, i) => `${f} = $${i + 2}`).join(', ');

  try {
    const { rows } = await pool.query(
      `UPDATE nodes SET ${setClause} WHERE node_id = $1
       RETURNING node_id, node_code, name, depth, treatment, position, status, flagged, active, eui, dev_addr, board_serial, created_at, updated_at`,
      [nodeId, ...values]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `no node with node_id ${nodeId}` });
    }
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const field = DUPLICATE_FIELD_BY_CONSTRAINT[err.constraint] || 'a field';
      return res.status(409).json({ error: `${field} already in use by another node` });
    }
    if (err.code === '22001') {
      return res.status(400).json({ error: 'a field is too long for its column (treatment<=20, position<=50, name/status<=100, eui<=16, dev_addr<=8, board_serial<=50)' });
    }
    res.status(502).json({ error: err.message });
  }
});

// Downlink — queues a command for the physical device (LED on/off, reporting
// interval) instead of calling Node-RED directly: Node-RED runs on the LoRa
// gateway's local network behind a router with a dynamic IP, which this
// backend (a public server) can never reliably reach. Node-RED already proves
// it has outbound internet access every time it POSTs an uplink to
// /api/ingest/log, so the fix is to invert the direction — this just inserts
// a row here; routes/downlink.js is what Node-RED itself polls to pick it up
// and ack once actually sent. See routes/downlink.js for the full flow.
const DOWNLINK_COMMANDS = {
  // Reporting interval, in minutes between uplinks — must be a positive integer.
  time: (v) => Number.isInteger(v) && v > 0,
  // LED on/off.
  led: (v) => v === 0 || v === 1,
};

router.post('/:node_id/downlink', async (req, res) => {
  const nodeId = Number(req.params.node_id);
  const { command, value } = req.body || {};

  const validate = DOWNLINK_COMMANDS[command];
  if (!validate) {
    return res.status(400).json({ error: `command must be one of: ${Object.keys(DOWNLINK_COMMANDS).join(', ')}` });
  }
  const numValue = Number(value);
  if (!validate(numValue)) {
    return res.status(400).json({
      error: command === 'time' ? 'value must be a positive integer (minutes)' : 'value must be 0 (off) or 1 (on)',
    });
  }

  try {
    const { rows: nodeRows } = await pool.query('SELECT node_id FROM nodes WHERE node_id = $1', [nodeId]);
    if (nodeRows.length === 0) {
      return res.status(404).json({ error: `no node with node_id ${nodeId}` });
    }
    const { rows } = await pool.query(
      `INSERT INTO downlink_commands (node_id, command, value) VALUES ($1, $2, $3)
       RETURNING id, node_id, command, value, status, created_at`,
      [nodeId, command, numValue]
    );
    res.status(201).json({ ok: true, queued: rows[0] });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Soft delete only — never touches log/node_log, so history survives.
router.delete('/:node_id', async (req, res) => {
  const nodeId = Number(req.params.node_id);
  try {
    const { rows } = await pool.query(
      'UPDATE nodes SET active = false WHERE node_id = $1 RETURNING node_id',
      [nodeId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: `no node with node_id ${nodeId}` });
    }
    res.json({ ok: true, node_id: nodeId });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
