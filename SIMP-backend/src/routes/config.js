import { Router } from 'express';
import { getAmbientConfig, updateAmbientConfig } from '../config/ambientConfig.js';

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

export default router;
