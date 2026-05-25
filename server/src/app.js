import cors from 'cors';
import express from 'express';
import apiRouter from './routes/index.js';

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: corsOrigins,
  }),
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'COZY API',
    docs: '/api/health',
  });
});

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: `경로를 찾을 수 없습니다: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

export default app;
