import { Router } from 'express';

/**
 * Proxies the Ambient Weather API endpoints the frontend needs (see
 * sugarcane-dashboard/src/lib/api/ambientWeatherClient.js) so apiKey/applicationKey
 * stay server-side instead of being readable from the browser's Network tab.
 */

const router = Router();

const BASE_URL = 'https://rt.ambientweather.net/v1';
const MAX_LIMIT = 288; // at 1-minute resolution = 4.8h/request, same cap the frontend used
const REQUEST_DELAY_MS = 1300; // Ambient Weather rate limit: 1 request/second

const { AMBIENT_API_KEY, AMBIENT_APPLICATION_KEY, AMBIENT_STATION_MAC } = process.env;

function authQuery() {
  return `apiKey=${encodeURIComponent(AMBIENT_API_KEY)}&applicationKey=${encodeURIComponent(AMBIENT_APPLICATION_KEY)}`;
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
  if (!AMBIENT_API_KEY || !AMBIENT_APPLICATION_KEY || (needMac && !AMBIENT_STATION_MAC)) {
    res.status(500).json({ error: 'Server is missing AMBIENT_API_KEY/AMBIENT_APPLICATION_KEY/AMBIENT_STATION_MAC in .env' });
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

// GET /api/weather/historical?endDate=<ms epoch>&limit=<n> — one page of historical
// records for the configured station, ending at endDate (paginate by re-calling with
// an earlier endDate, same as fetchAllHistorical did client-side before)
router.get('/historical', async (req, res) => {
  if (!requireCredentials(res, true)) return;

  const { endDate } = req.query;
  if (!endDate) {
    return res.status(400).json({ error: 'endDate query param is required (ms epoch)' });
  }
  const limit = Math.min(Number(req.query.limit) || MAX_LIMIT, MAX_LIMIT);

  try {
    const url = `${BASE_URL}/devices/${AMBIENT_STATION_MAC}?endDate=${endDate}&limit=${limit}&${authQuery()}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
