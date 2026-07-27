import { Router } from 'express';
import { pool } from '../db/pool.js';

/**
 * Registers/records a sensor node's metadata (nodes table) — e.g. from a
 * provisioning flow that knows the node's LoRaWAN identifiers (eui, dev_addr)
 * at commissioning time, alongside the usual depth/treatment/position fields.
 */

const router = Router();

// GET /api/nodes — full metadata for every registered node (for the Settings page's node table)
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT node_id, node_code, name, depth, treatment, position, status, flagged, eui, dev_addr, created_at, updated_at
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
};

router.post('/', async (req, res) => {
  const { node_id: rawNodeId, node_code, name, depth, treatment, position, status, flagged, eui, dev_addr } = req.body || {};

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
      `INSERT INTO nodes (node_id, node_code, name, depth, treatment, position, status, flagged, eui, dev_addr)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING node_id, node_code, name, depth, treatment, position, status, flagged, eui, dev_addr, created_at, updated_at`,
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
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const field = DUPLICATE_FIELD_BY_CONSTRAINT[err.constraint] || 'a field';
      return res.status(409).json({ error: `${field} already in use by another node` });
    }
    if (err.code === '22001') {
      return res.status(400).json({ error: 'a field is too long for its column (node_code<=20, treatment<=20, position<=50, name/status<=100, eui<=16, dev_addr<=8)' });
    }
    res.status(502).json({ error: err.message });
  }
});

export default router;
