import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('BEGIN');

  await pool.query('DROP TABLE IF EXISTS order_items CASCADE');
  await pool.query('DROP TABLE IF EXISTS orders CASCADE');

  await pool.query(`
    CREATE TABLE orders (
      id VARCHAR(64) PRIMARY KEY,
      ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status VARCHAR(20) NOT NULL DEFAULT 'received'
        CHECK (status IN ('received', 'making', 'done')),
      total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE order_items (
      id SERIAL PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_id VARCHAR(32) NOT NULL,
      menu_name VARCHAR(100) NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
      line_total INTEGER NOT NULL CHECK (line_total >= 0),
      options_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON orders(ordered_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');

  await pool.query('COMMIT');
  console.log('✓ orders / order_items 스키마를 API 형식으로 맞췄습니다.');
} catch (err) {
  await pool.query('ROLLBACK');
  console.error('✗ 실패:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
