import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(`
    UPDATE orders SET status = 'making' WHERE status = 'preparing';
    UPDATE orders SET status = 'done' WHERE status = 'completed';
  `);

  await pool.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
  await pool.query(`
    ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('received', 'making', 'done'))
  `);

  console.log('✓ 주문 상태 제약 조건을 received / making / done 으로 맞췄습니다.');
} catch (err) {
  console.error('✗ 마이그레이션 실패:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
