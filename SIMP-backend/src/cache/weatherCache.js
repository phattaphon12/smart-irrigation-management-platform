import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * On-disk cache of raw 1-minute Ambient Weather records (data/weather-cache.json).
 * The station's history only grows forward in time, so a page load only ever needs
 * to fetch the gap between the newest cached record and "now" — not the whole
 * 304-day window every time. First run (empty cache) still pays the full ~30min cost.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, '..', '..', 'data', 'weather-cache.json');

let records = []; // sorted ascending by dateutc, deduped

if (existsSync(CACHE_PATH)) {
  try {
    records = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    // corrupt/unreadable cache file — start fresh rather than crash the server
    records = [];
  }
}

function save() {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(records));
}

export function getCachedRecords(sinceMs) {
  return sinceMs == null ? records : records.filter((r) => r.dateutc >= sinceMs);
}

export function getNewestCachedTimestamp() {
  return records.length ? records[records.length - 1].dateutc : null;
}

/** Merge newly-fetched records into the cache (dedupe by dateutc) and persist to disk. */
export function mergeRecords(newRecords) {
  if (!newRecords || newRecords.length === 0) return;
  const seen = new Set(records.map((r) => r.dateutc));
  const toAdd = newRecords.filter((r) => !seen.has(r.dateutc));
  if (toAdd.length === 0) return;
  records = [...records, ...toAdd].sort((a, b) => a.dateutc - b.dateutc);
  save();
}
