import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import weatherRouter from './routes/weather.js';
import configRouter from './routes/config.js';
import soilNodesRouter from './routes/soilNodes.js';
import ingestRouter from './routes/ingest.js';
import nodesRouter from './routes/nodes.js';
import logsRouter from './routes/logs.js';
import tensiometerRouter from './routes/tensiometer.js';
import calibrationProfilesRouter from './routes/calibrationProfiles.js';
import downlinkRouter from './routes/downlink.js';

const app = express();
const PORT = process.env.PORT || 4000;
// Comma-separated so prod can stay locked to its own domain while still
// letting a developer's local frontend (VITE_BACKEND_URL pointed at prod)
// call this same backend directly.
const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/weather', weatherRouter);
app.use('/api/config', configRouter);
app.use('/api/soil-nodes', soilNodesRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/tensiometer', tensiometerRouter);
app.use('/api/calibration-profiles', calibrationProfilesRouter);
app.use('/api/downlink', downlinkRouter);

app.listen(PORT, () => {
  console.log(`sugarcane-backend listening on http://localhost:${PORT}`);
});
