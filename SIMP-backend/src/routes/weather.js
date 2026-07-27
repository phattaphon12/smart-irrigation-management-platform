import { Router } from 'express';
import { getAmbientConfig } from '../config/ambientConfig.js';
import { getCachedRecords, getNewestCachedTimestamp, mergeRecords } from '../cache/weatherCache.js';
import { startProgress, updateProgress, finishProgress, getProgress } from '../state/fetchProgress.js';

/**
 * Proxies the Ambient Weather API endpoints the frontend needs (see
 * sugarcane-dashboard/src/lib/api/ambientWeatherClient.js) so apiKey/applicationKey
 * stay server-side instead of being readable from the browser's Network tab.
 *
 * Credentials come from getAmbientConfig() (not a static process.env destructure) so
 * edits made via the Settings page (PUT /api/config/ambient) take effect immediately,
 * without restarting the server.
 *
 * GET /history does the full backward-pagination walk server-side and caches every
 * record it fetches (see ../cache/weatherCache.js) — a repeat call only fetches the
 * gap since the newest cached record instead of re-walking the whole window.
 */

const router = Router();

const BASE_URL = 'https://rt.ambientweather.net/v1';
const MAX_LIMIT = 288; // at 1-minute resolution = 4.8h/request, same cap the frontend used
const REQUEST_DELAY_MS = 1300; // Ambient Weather rate limit: 1 request/second
const EMPTY_STREAK_STOP_DAYS = 30;
const DEFAULT_SINCE_DAYS = 304;

function authQuery() {
  const { apiKey, applicationKey } = getAmbientConfig();
  return `apiKey=${encodeURIComponent(apiKey)}&applicationKey=${encodeURIComponent(applicationKey)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const res = await fetch(url);
    if (res.status === 429) {
      await sleep(REQUEST_DELAY_MS * 2 ** attempt);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Ambient Weather API error: HTTP ${res.status}`);
    }
    return res.json();
  }
  throw new Error('Ambient Weather API: exceeded max retries after repeated HTTP 429');
}

function requireCredentials(res, needMac) {
  const { apiKey, applicationKey, stationMac } = getAmbientConfig();
  if (!apiKey || !applicationKey || (needMac && !stationMac)) {
    res.status(500).json({ error: 'Ambient Weather API key/application key/station MAC not configured — set them on the Settings page' });
    return false;
  }
  return true;
}

// GET /api/weather/latest — the account's registered devices + their most recent reading
router.get('/latest', async (_req, res) => {
  if (!requireCredentials(res, false)) return;
  try {
    const devices = await fetchWithRetry(`${BASE_URL}/devices?${authQuery()}`);
    res.json(devices ?? []);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// GET /api/weather/progress — poll this while /history is in flight for a live count
router.get('/progress', (_req, res) => {
  res.json(getProgress());
});

// GET /api/weather/history?sinceDays=304 — full raw record set for the last N days,
// served from cache plus only the gap that's actually missing.
router.get('/history', async (req, res) => {
  if (!requireCredentials(res, true)) return;

  const sinceDays = Number(req.query.sinceDays) || DEFAULT_SINCE_DAYS;
  const sinceMs = Date.now() - sinceDays * 86400000;

  try {
    const { stationMac } = getAmbientConfig();
    const devices = await fetchWithRetry(`${BASE_URL}/devices?${authQuery()}`);
    const lastDateutc = devices?.[0]?.lastData?.dateutc;
    if (!lastDateutc) {
      return res.status(502).json({ error: 'ไม่พบ lastData.dateutc จากสถานี — ตรวจสอบการตั้งค่าที่หน้า Settings' });
    }

    const newestCached = getNewestCachedTimestamp();
    // stop the backward walk at whichever boundary is more recent: what's already
    // cached, or the requested window — so a warm cache only fills the small gap
    // since its newest record instead of re-walking the full sinceDays window.
    const stopAt = Math.max(newestCached ?? -Infinity, sinceMs);

    let cursor = lastDateutc;
    const collected = [];
    let emptyStreakDays = 0;

    startProgress();
    try {
      while (cursor > stopAt && emptyStreakDays < EMPTY_STREAK_STOP_DAYS) {
        await sleep(REQUEST_DELAY_MS);
        const url = `${BASE_URL}/devices/${stationMac}?endDate=${cursor}&limit=${MAX_LIMIT}&${authQuery()}`;
        const chunk = await fetchWithRetry(url);

        if (!chunk || chunk.length === 0) {
          cursor -= 86400000; // jump back 1 day on a gap (station offline) and keep going
          emptyStreakDays += 1;
          continue;
        }

        emptyStreakDays = 0;
        collected.push(...chunk);
        cursor = chunk[chunk.length - 1].dateutc - 1;
        updateProgress(collected.length);
      }
    } finally {
      finishProgress();
    }

    mergeRecords(collected);
    res.json(getCachedRecords(sinceMs));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
