import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const db = await pool.query('SELECT current_database() AS name');
console.log('DB:', db.rows[0].name);

const tables = await pool.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' ORDER BY table_name`,
);
console.log('Tables:', tables.rows.map((r) => r.table_name).join(', ') || '(none)');

if (tables.rows.some((r) => r.table_name === 'menus')) {
  const menus = await pool.query('SELECT COUNT(*)::int AS n FROM menus');
  console.log('Menus:', menus.rows[0].n);
}

if (tables.rows.some((r) => r.table_name === 'orders')) {
  const cols = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'orders' ORDER BY ordinal_position`,
  );
  console.log('orders columns:', cols.rows.map((r) => r.column_name).join(', '));
}

await pool.end();
