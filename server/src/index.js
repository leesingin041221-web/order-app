import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';
import { testConnection } from './db/pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    const db = await testConnection();
    console.log(`✓ PostgreSQL 연결됨 (DB: ${db.database})`);
  } catch (err) {
    console.error('✗ PostgreSQL 연결 실패:', err.message);
    console.error('  .env의 DATABASE_URL을 확인하고, npm run db:init 을 실행하세요.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`COZY API 서버 실행 중: http://localhost:${PORT}`);
    console.log(`헬스 체크: http://localhost:${PORT}/api/health`);
  });
}

start();
