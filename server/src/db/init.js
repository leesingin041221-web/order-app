import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { getDatabaseUrl } from './config.js';
import { closePool, getPool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '..', '..', '.env') });

async function runSqlFile(filename) {
  const path = join(__dirname, filename);
  const sql = readFileSync(path, 'utf8');
  const db = getPool();
  await db.query(sql);
  console.log(`✓ ${filename} 적용 완료`);
}

export async function initDatabase() {
  await runSqlFile('schema.sql');
  await runSqlFile('seed.sql');
}

async function ensureCozyDatabase() {
  const url = getDatabaseUrl();
  if (!/\/cozy(\?|$)/i.test(url.replace(/\?.*$/, ''))) {
    return;
  }

  const baseUrl = url.replace(/\/cozy(\?.*)?$/i, '/postgres$1');
  const admin = new pg.Pool({ connectionString: baseUrl });
  try {
    const { rows } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = 'cozy'",
    );
    if (rows.length === 0) {
      await admin.query('CREATE DATABASE cozy');
      console.log('✓ 데이터베이스 cozy 생성');
    }
  } finally {
    await admin.end();
  }
}

async function main() {
  try {
    console.log('PostgreSQL 연결 중...');
    await ensureCozyDatabase();
    const db = getPool();
    await db.query('SELECT 1');
    const { database } = await testConnection();
    console.log(`✓ 데이터베이스 연결 성공 (${database})`);

    await initDatabase();
    console.log('✓ 스키마·시드 데이터 준비 완료');
  } catch (err) {
    console.error('✗ DB 초기화 실패:', err.message);
    if (err.code === '3D000') {
      console.error('  → 데이터베이스 "cozy"가 없습니다. CREATE DATABASE cozy; 를 실행하세요.');
    } else if (err.code === '28P01') {
      console.error('  → 비밀번호가 틀렸습니다. .env의 DATABASE_URL을 확인하세요.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('  → PostgreSQL 서비스가 실행 중인지 확인하세요.');
    }
    process.exit(1);
  } finally {
    await closePool();
  }
}

import { pathToFileURL } from 'url';

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main();
}
