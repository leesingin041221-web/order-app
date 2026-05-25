import { Router } from 'express';
import { getPool, testConnection } from '../db/pool.js';
import menusRouter from './menus.js';
import ordersRouter from './orders.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    const db = await testConnection();
    const pool = getPool();
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM menus');
    res.json({
      ok: true,
      service: 'cozy-server',
      database: db.database,
      menus: rows[0].count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      service: 'cozy-server',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.use('/menus', menusRouter);
router.use('/orders', ordersRouter);

export default router;
