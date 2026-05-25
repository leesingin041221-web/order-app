import { Router } from 'express';
import { getPool } from '../db/pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const MENU_SELECT = `
  SELECT
    m.id,
    m.name,
    m.description,
    m.price,
    m.image_url,
    m.stock,
    (m.stock > 0) AS is_available,
    COALESCE(
      json_agg(
        json_build_object('id', o.id, 'name', o.name, 'price', o.price)
        ORDER BY o.id
      ) FILTER (WHERE o.id IS NOT NULL),
      '[]'
    ) AS options
  FROM menus m
  LEFT JOIN menu_options mo ON m.id = mo.menu_id
  LEFT JOIN options o ON o.id = mo.option_id
`;

function mapMenuRow(row, includeStock) {
  const menu = {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image_url: row.image_url,
    is_available: row.is_available,
    options: row.options ?? [],
  };
  if (includeStock) {
    menu.stock = row.stock;
  }
  return menu;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeStock = req.query.include === 'stock';
    const pool = getPool();
    const { rows } = await pool.query(
      `${MENU_SELECT}
       GROUP BY m.id
       ORDER BY m.id`,
    );
    res.json(rows.map((row) => mapMenuRow(row, includeStock)));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query(
      `${MENU_SELECT}
       WHERE m.id = $1
       GROUP BY m.id`,
      [req.params.id],
    );
    if (!rows.length) {
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
    }
    res.json(mapMenuRow(rows[0], true));
  }),
);

router.patch(
  '/:id/stock',
  asyncHandler(async (req, res) => {
    const menuId = Number(req.params.id);
    const { stock, delta } = req.body ?? {};

    if (Number.isNaN(menuId)) {
      return res.status(400).json({ error: '잘못된 메뉴 ID입니다.' });
    }

    const pool = getPool();
    let query;
    let params;

    if (typeof stock === 'number') {
      query = `UPDATE menus SET stock = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
      params = [Math.max(0, Math.min(99, stock)), menuId];
    } else if (typeof delta === 'number') {
      query = `UPDATE menus SET stock = LEAST(99, GREATEST(0, stock + $1)), updated_at = NOW()
               WHERE id = $2 RETURNING *`;
      params = [delta, menuId];
    } else {
      return res.status(400).json({ error: 'stock 또는 delta 값이 필요합니다.' });
    }

    const { rows } = await pool.query(query, params);
    if (!rows.length) {
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
    }

    const row = rows[0];
    res.json({
      id: row.id,
      name: row.name,
      stock: row.stock,
      is_available: row.stock > 0,
    });
  }),
);

export default router;
