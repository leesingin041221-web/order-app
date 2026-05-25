import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getPool, closePool } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const MENU_NAME = '카라멜 마키아토';

async function main() {
  const pool = getPool();

  const found = await pool.query(
    'SELECT id, name FROM menus WHERE name = $1 OR id::text = $2',
    [MENU_NAME, 'caramel-macchiato'],
  );

  if (!found.rows.length) {
    console.log('삭제할 메뉴가 없습니다.');
    await closePool();
    return;
  }

  for (const menu of found.rows) {
    const menuId = menu.id;
    await pool.query('DELETE FROM menu_options WHERE menu_id = $1', [menuId]);
    await pool.query('DELETE FROM order_items WHERE menu_id = $1', [menuId]);
    await pool.query('DELETE FROM menus WHERE id = $1', [menuId]);
    console.log(`삭제됨: ${menu.name} (id: ${menuId})`);
  }

  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM menus');
  console.log(`현재 메뉴 ${rows[0].c}개`);
  await closePool();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
