import dotenv from 'dotenv';
import pg from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const tables = ['orders', 'order_items'];
for (const table of tables) {
  const { rows } = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = $1 ORDER BY ordinal_position`,
    [table],
  );
  console.log(`\n${table}:`, rows);
}

const orders = await pool.query('SELECT * FROM orders ORDER BY ordered_at DESC LIMIT 3');
console.log('\norders data:', orders.rows);

const items = await pool.query('SELECT * FROM order_items ORDER BY id DESC LIMIT 5');
console.log('\norder_items data:', items.rows);

await pool.end();
