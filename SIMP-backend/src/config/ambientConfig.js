import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Runtime-editable Ambient Weather credentials. Seeded from .env on first boot,
 * then persisted to data/ambient-config.json so edits made via the Settings page
 * survive a server restart without needing to touch .env by hand.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', '..', 'data', 'ambient-config.json');

let config = {
  apiKey: process.env.AMBIENT_API_KEY || '',
  applicationKey: process.env.AMBIENT_APPLICATION_KEY || '',
  stationMac: process.env.AMBIENT_STATION_MAC || '',
};

if (existsSync(CONFIG_PATH)) {
  try {
    config = { ...config, ...JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) };
  } catch {
    // corrupt/unreadable file — keep the .env-seeded defaults
  }
}

function save() {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getAmbientConfig() {
  return { ...config };
}

export function updateAmbientConfig(patch) {
  config = { ...config, ...patch };
  save();
  return { ...config };
}
