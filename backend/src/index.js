import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const origenes = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({ origin: origenes.length ? origenes : true }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'pachamapa', hora: new Date().toISOString() }));

app.listen(PORT, () => console.log(`pachamapa backend en http://localhost:${PORT}`));
