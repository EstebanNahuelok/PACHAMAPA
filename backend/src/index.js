import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import tramosRouter from './routes/tramos.js';
import reportesRouter from './routes/reportes.js';
import traccionRouter from './routes/traccion.js';
import alertasRouter from './routes/alertas.js';
import asistenteRouter from './routes/asistente.js';
import viajeRouter from './routes/viaje.js';
import { revisarAlertas } from './services/whatsappAlertas.js';
import { iniciarActualizacionAutomatica } from './services/openMeteo.js';
import { iniciarNoticias } from './services/noticias.js';

const app = express();
const PORT = process.env.PORT || 3001;
const origenes = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);

app.set('trust proxy', 1);
app.use(cors({ origin: origenes.length ? origenes : true }));
app.use(compression());
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'pachamapa', hora: new Date().toISOString() }));
app.use('/api/tramos', tramosRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/alertas', alertasRouter);
app.use('/api/asistente', asistenteRouter);
app.use('/api', viajeRouter);
app.use('/api', traccionRouter);

app.use((_req, res) => res.status(404).json({ error: 'No encontrado' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Error interno' });
});

app.listen(PORT, () => {
  console.log(`pachamapa backend en http://localhost:${PORT}`);
  iniciarActualizacionAutomatica(revisarAlertas);
  iniciarNoticias();
});
