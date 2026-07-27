import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import weatherRouter from './routes/weather.js';
import configRouter from './routes/config.js';
import soilNodesRouter from './routes/soilNodes.js';
import ingestRouter from './routes/ingest.js';
import nodesRouter from './routes/nodes.js';
import logsRouter from './routes/logs.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/weather', weatherRouter);
app.use('/api/config', configRouter);
app.use('/api/soil-nodes', soilNodesRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/logs', logsRouter);

app.listen(PORT, () => {
  console.log(`sugarcane-backend listening on http://localhost:${PORT}`);
});
