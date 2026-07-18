import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import weatherRouter from './routes/weather.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/weather', weatherRouter);

app.listen(PORT, () => {
  console.log(`sugarcane-backend listening on http://localhost:${PORT}`);
});
