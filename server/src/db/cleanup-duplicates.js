import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getPool, closePool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

async function main() {
  const pool = getPool();
  const before = await pool.query('SELECT COUNT(*)::int AS c FROM menus');

  await pool.query(`
    UPDATE order_items oi
    SET menu_id = kept.id
    FROM menus dup
    INNER JOIN menus kept ON kept.name = dup.name AND kept.id < dup.id
    WHERE oi.menu_id = dup.id
  `);

  await pool.query(`
    DELETE FROM menu_options mo
    USING menus dup
    INNER JOIN menus kept ON kept.name = dup.name AND kept.id < dup.id
    WHERE mo.menu_id = dup.id
  `);

  await pool.query(`
    DELETE FROM menus a
    USING menus b
    WHERE a.id > b.id AND a.name = b.name
  `);

  const after = await pool.query('SELECT COUNT(*)::int AS c FROM menus');
  console.log(`메뉴 정리: ${before.rows[0].c}개 → ${after.rows[0].c}개`);
  await closePool();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
