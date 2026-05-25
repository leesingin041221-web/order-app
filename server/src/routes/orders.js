import { Router } from 'express';
import { getPool } from '../db/pool.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const STATUS_NEXT = {
  received: 'making',
  making: 'done',
};

const ALLOWED_TRANSITIONS = {
  received: ['making', 'done'],
  making: ['done'],
};

function createOrderId() {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseOptionsSnapshot(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

function formatOptionLabel(snapshot) {
  const list = parseOptionsSnapshot(snapshot);
  if (!list.length) return '';
  const names = list.map((o) => o.name).join(', ');
  return ` (${names})`;
}

function mapOrderRow(order, items) {
  const total =
    order.total_amount ?? order.total_price ?? order.totalAmount ?? 0;

  return {
    id: order.id,
    orderedAt: order.ordered_at,
    createdAt: order.ordered_at ?? order.created_at,
    status: order.status,
    totalPrice: Number(total) || 0,
    items: items.map((item) => {
      const unitPrice = Number(item.unit_price) || 0;
      const subtotal =
        Number(item.line_total ?? item.subtotal) || unitPrice * item.quantity;

      return {
        menuId: item.menu_id,
        name: item.menu_name,
        optionLabel: formatOptionLabel(item.options_snapshot),
        quantity: Number(item.quantity) || 0,
        unitPrice,
        subtotal,
        optionsSnapshot: parseOptionsSnapshot(item.options_snapshot),
      };
    }),
  };
}

async function fetchOrderById(pool, orderId) {
  const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!orderResult.rows.length) return null;

  const itemsResult = await pool.query(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id`,
    [orderId],
  );

  return mapOrderRow(orderResult.rows[0], itemsResult.rows);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { status } = req.query;

    let ordersQuery = 'SELECT * FROM orders ORDER BY ordered_at DESC';
    const params = [];

    if (status) {
      ordersQuery = 'SELECT * FROM orders WHERE status = $1 ORDER BY ordered_at DESC';
      params.push(status);
    }

    const { rows: orders } = await pool.query(ordersQuery, params);

    const result = [];
    for (const order of orders) {
      const { rows: items } = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
        [order.id],
      );
      result.push(mapOrderRow(order, items));
    }

    const dashboard = {
      total: orders.length,
      received: orders.filter((o) => o.status === 'received').length,
      making: orders.filter((o) => o.status === 'making').length,
      done: orders.filter((o) => o.status === 'done').length,
    };

    res.json({ orders: result, dashboard });
  }),
);

router.delete(
  '/',
  asyncHandler(async (_req, res) => {
    const pool = getPool();
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    res.json({
      orders: [],
      dashboard: { total: 0, received: 0, making: 0, done: 0 },
    });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const order = await fetchOrderById(pool, req.params.id);
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
    }
    res.json(order);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { items } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '주문 항목이 필요합니다.' });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const prepared = [];
      let totalPrice = 0;

      for (const item of items) {
        const menuId = String(item.menu_id);
        const quantity = Number(item.quantity);
        const optionIds = Array.isArray(item.option_ids) ? item.option_ids : [];

        if (!menuId || !quantity || quantity < 1) {
          throw Object.assign(new Error('잘못된 주문 항목입니다.'), { status: 400 });
        }

        const menuResult = await client.query(
          'SELECT * FROM menus WHERE id::text = $1 OR id = $2',
          [menuId, Number(menuId) || 0],
        );
        if (!menuResult.rows.length) {
          throw Object.assign(new Error('메뉴를 찾을 수 없습니다.'), { status: 404 });
        }

        const menu = menuResult.rows[0];
        if (menu.stock < quantity) {
          throw Object.assign(new Error('재고가 부족합니다.'), { status: 400 });
        }

        let optionExtra = 0;
        const optionsSnapshot = [];

        if (optionIds.length) {
          const { rows: opts } = await client.query(
            `SELECT o.id, o.name, o.price
             FROM options o
             INNER JOIN menu_options mo ON mo.option_id = o.id
             WHERE mo.menu_id::text = $1 OR mo.menu_id = $2
               AND o.id = ANY($3::varchar[])`,
            [menuId, Number(menuId) || 0, optionIds],
          );

          if (opts.length !== optionIds.length) {
            throw Object.assign(new Error('옵션을 확인할 수 없습니다.'), { status: 400 });
          }

          for (const opt of opts) {
            optionExtra += Number(opt.price) || 0;
            optionsSnapshot.push({ id: opt.id, name: opt.name, price: opt.price });
          }
        }

        const unitPrice = Number(menu.price) + optionExtra;
        const lineTotal = unitPrice * quantity;
        totalPrice += lineTotal;

        prepared.push({
          menuId: String(menu.id),
          menuName: menu.name,
          quantity,
          unitPrice,
          lineTotal,
          optionsSnapshot,
        });
      }

      const orderId = createOrderId();

      await client.query(
        `INSERT INTO orders (id, status, total_amount, ordered_at, created_at, updated_at)
         VALUES ($1, 'received', $2, NOW(), NOW(), NOW())`,
        [orderId, totalPrice],
      );

      const hasOptionsColumn = await client.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'order_items' AND column_name = 'options_snapshot'`,
      );

      for (const line of prepared) {
        if (hasOptionsColumn.rows.length) {
          await client.query(
            `INSERT INTO order_items
             (order_id, menu_id, menu_name, quantity, unit_price, line_total, options_snapshot)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              orderId,
              line.menuId,
              line.menuName,
              line.quantity,
              line.unitPrice,
              line.lineTotal,
              JSON.stringify(line.optionsSnapshot),
            ],
          );
        } else {
          await client.query(
            `INSERT INTO order_items
             (order_id, menu_id, menu_name, quantity, unit_price, line_total)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              orderId,
              line.menuId,
              line.menuName,
              line.quantity,
              line.unitPrice,
              line.lineTotal,
            ],
          );
        }

        await client.query(
          `UPDATE menus SET stock = stock - $1, updated_at = NOW()
           WHERE id::text = $2 OR id = $3`,
          [line.quantity, line.menuId, Number(line.menuId) || 0],
        );
      }

      await client.query('COMMIT');

      const created = await fetchOrderById(pool, orderId);
      res.status(201).json(created);
    } catch (err) {
      await client.query('ROLLBACK');
      const status = err.status ?? 500;
      res.status(status).json({ error: err.message ?? '주문 처리에 실패했습니다.' });
    } finally {
      client.release();
    }
  }),
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const pool = getPool();

    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
    }

    const current = rows[0].status;
    const requestedStatus = req.body?.status;
    let nextStatus;

    if (requestedStatus) {
      const allowed = ALLOWED_TRANSITIONS[current] ?? [];
      if (!allowed.includes(requestedStatus)) {
        return res.status(400).json({ error: '변경할 수 없는 상태입니다.' });
      }
      nextStatus = requestedStatus;
    } else {
      nextStatus = STATUS_NEXT[current];
    }

    if (!nextStatus) {
      return res.status(400).json({ error: '변경할 수 없는 상태입니다.' });
    }

    await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [nextStatus, req.params.id],
    );

    const order = await fetchOrderById(pool, req.params.id);
    res.json(order);
  }),
);

export default router;
