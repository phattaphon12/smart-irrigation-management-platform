import { Router } from 'express';
import { getAmbientConfig, updateAmbientConfig } from '../config/ambientConfig.js';
import { getCalibrationConfig, updateCalibrationConfig, CALIBRATION_FIELDS } from '../config/calibrationConfig.js';
import { getCropConfig, updateCropConfig, CROP_TYPES } from '../config/cropConfig.js';
import { getIngestConfig, updateIngestConfig, DATA_SOURCES } from '../config/ingestConfig.js';

const router = Router();

// Never send the raw secret back to the browser — only enough to confirm it's
// set and let the user recognize which key is currently saved.
function mask(secret) {
  if (!secret) return '';
  if (secret.length <= 4) return '*'.repeat(secret.length);
  return `${'*'.repeat(secret.length - 4)}${secret.slice(-4)}`;
}

function toPublicShape(config) {
  return {
    apiKey: mask(config.apiKey),
    applicationKey: mask(config.applicationKey),
    stationMac: config.stationMac,
    apiKeySet: !!config.apiKey,
    applicationKeySet: !!config.applicationKey,
  };
}

router.get('/ambient', (_req, res) => {
  res.json(toPublicShape(getAmbientConfig()));
});

router.put('/ambient', (req, res) => {
  const { apiKey, applicationKey, stationMac } = req.body || {};
  const patch = {};
  // Only overwrite fields the user actually typed something into — an empty
  // field means "leave this one alone", not "clear it".
  if (typeof apiKey === 'string' && apiKey.trim()) patch.apiKey = apiKey.trim();
  if (typeof applicationKey === 'string' && applicationKey.trim()) patch.applicationKey = applicationKey.trim();
  if (typeof stationMac === 'string' && stationMac.trim()) patch.stationMac = stationMac.trim();

  res.json(toPublicShape(updateAmbientConfig(patch)));
});

// Not secrets — plain numeric calibration constants, no masking needed.
router.get('/calibration', (_req, res) => {
  res.json(getCalibrationConfig());
});

router.put('/calibration', async (req, res) => {
  const body = req.body || {};
  const patch = {};
  for (const field of CALIBRATION_FIELDS) {
    if (body[field] === undefined) continue;
    const n = Number(body[field]);
    if (!Number.isFinite(n)) {
      return res.status(400).json({ error: `${field} must be a finite number` });
    }
    patch[field] = n;
  }

  try {
    res.json(await updateCalibrationConfig(patch));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

function toCropPublicShape(config) {
  return { plantingDate: config.planting_date, cropType: config.crop_type, updatedAt: config.updated_at };
}

router.get('/crop', (_req, res) => {
  res.json(toCropPublicShape(getCropConfig()));
});

router.put('/crop', async (req, res) => {
  const { plantingDate, cropType } = req.body || {};
  const patch = {};

  if (plantingDate !== undefined) {
    if (typeof plantingDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(plantingDate)) {
      return res.status(400).json({ error: 'plantingDate must be a YYYY-MM-DD string' });
    }
    patch.plantingDate = plantingDate;
  }
  if (cropType !== undefined) {
    if (!CROP_TYPES.includes(cropType)) {
      return res.status(400).json({ error: `cropType must be one of: ${CROP_TYPES.join(', ')}` });
    }
    patch.cropType = cropType;
  }

  try {
    res.json(toCropPublicShape(await updateCropConfig(patch)));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

function toIngestPublicShape(config) {
  return { dataSource: config.data_source, updatedAt: config.updated_at };
}

router.get('/ingest', (_req, res) => {
  res.json(toIngestPublicShape(getIngestConfig()));
});

router.put('/ingest', async (req, res) => {
  const { dataSource } = req.body || {};
  if (dataSource === undefined) return res.json(toIngestPublicShape(getIngestConfig()));
  if (!DATA_SOURCES.includes(dataSource)) {
    return res.status(400).json({ error: `dataSource must be one of: ${DATA_SOURCES.join(', ')}` });
  }
  try {
    res.json(toIngestPublicShape(await updateIngestConfig({ dataSource })));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
