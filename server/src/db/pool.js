import pg from 'pg';
import { getDatabaseUrl } from './config.js';

const { Pool } = pg;

let pool;

export function getPool() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL 또는 PGUSER/PGPASSWORD/PGHOST/PGPORT/PGDATABASE를 .env에 설정하세요.',
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString });
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
    });
  }
  return pool;
}

export async function testConnection() {
  const db = getPool();
  const result = await db.query('SELECT NOW() AS now, current_database() AS database');
  return {
    connected: true,
    database: result.rows[0].database,
    serverTime: result.rows[0].now,
  };
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
