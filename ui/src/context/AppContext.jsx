import { useCallback, useEffect, useMemo, useState } from 'react';
import { INITIAL_MENUS, MENU_OPTIONS } from '../data/menus';
import { loadStoredState, saveStoredState } from '../utils/storage';
import { StoreContext } from './storeContext';

const MAX_STOCK = 99;

function cartLineKey(menuId, optionIds) {
  return `${menuId}:${[...optionIds].sort().join(',')}`;
}

function formatOptions(optionIds) {
  if (!optionIds.length) return '';
  const labels = optionIds.map((id) => {
    const opt = MENU_OPTIONS.find((o) => o.id === id);
    return opt?.label ?? id;
  });
  return ` (${labels.join(', ')})`;
}

function calcOptionExtra(optionIds) {
  return optionIds.reduce((sum, id) => {
    const opt = MENU_OPTIONS.find((o) => o.id === id);
    return sum + (opt?.price ?? 0);
  }, 0);
}

function cartQtyForMenu(cart, menuId) {
  return cart
    .filter((item) => item.menuId === menuId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

function createOrderId() {
  return crypto.randomUUID?.() ?? String(Date.now());
}

function getInitialState() {
  const stored = loadStoredState();
  if (stored) {
    return {
      menus: stored.menus,
      cart: stored.cart,
      orders: stored.orders,
    };
  }
  return {
    menus: INITIAL_MENUS.map((m) => ({ ...m })),
    cart: [],
    orders: [],
  };
}

export function AppProvider({ children }) {
  const [initial] = useState(getInitialState);
  const [menus, setMenus] = useState(initial.menus);
  const [cart, setCart] = useState(initial.cart);
  const [orders, setOrders] = useState(initial.orders);

  useEffect(() => {
    saveStoredState({ menus, cart, orders });
  }, [menus, cart, orders]);

  const addToCart = useCallback(
    (menuId, selectedOptions) => {
      const menu = menus.find((m) => m.id === menuId);
      if (!menu || menu.stock < 1) return { ok: false, reason: 'soldout' };

      const inCart = cartQtyForMenu(cart, menuId);
      if (inCart >= menu.stock) {
        return { ok: false, reason: 'stock' };
      }

      const optionIds = selectedOptions.filter((id) => id);
      const unitPrice = menu.price + calcOptionExtra(optionIds);
      const key = cartLineKey(menuId, optionIds);

      setCart((prev) => {
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          return prev.map((item) =>
            item.key === key ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [
          ...prev,
          {
            key,
            menuId,
            name: menu.name,
            optionIds,
            optionLabel: formatOptions(optionIds),
            unitPrice,
            quantity: 1,
          },
        ];
      });
      return { ok: true };
    },
    [menus, cart],
  );

  const decreaseCartItem = useCallback((key) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeCartItem = useCallback((key) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const placeOrder = useCallback(() => {
    if (cart.length === 0) return false;

    for (const item of cart) {
      const menu = menus.find((m) => m.id === item.menuId);
      if (!menu || menu.stock < item.quantity) return false;
    }

    const items = cart.map((item) => ({
      menuId: item.menuId,
      name: item.name,
      optionLabel: item.optionLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.unitPrice * item.quantity,
    }));

    const totalPrice = items.reduce((sum, i) => sum + i.subtotal, 0);

    setMenus((prev) =>
      prev.map((menu) => {
        const ordered = cart
          .filter((c) => c.menuId === menu.id)
          .reduce((sum, c) => sum + c.quantity, 0);
        return ordered ? { ...menu, stock: menu.stock - ordered } : menu;
      }),
    );

    setOrders((prev) => [
      {
        id: createOrderId(),
        createdAt: new Date(),
        items,
        totalPrice,
        status: 'received',
      },
      ...prev,
    ]);

    setCart([]);
    return true;
  }, [cart, menus]);

  const updateStock = useCallback((menuId, delta) => {
    setMenus((prev) =>
      prev.map((menu) =>
        menu.id === menuId
          ? {
              ...menu,
              stock: Math.min(MAX_STOCK, Math.max(0, menu.stock + delta)),
            }
          : menu,
      ),
    );
  }, []);

  const advanceOrderStatus = useCallback((orderId) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        if (order.status === 'received') return { ...order, status: 'making' };
        if (order.status === 'making') return { ...order, status: 'done' };
        return order;
      }),
    );
  }, []);

  const dashboard = useMemo(() => {
    const total = orders.length;
    const received = orders.filter((o) => o.status === 'received').length;
    const making = orders.filter((o) => o.status === 'making').length;
    const done = orders.filter((o) => o.status === 'done').length;
    return { total, received, making, done };
  }, [orders]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );

  const value = useMemo(
    () => ({
      menus,
      cart,
      cartTotal,
      orders,
      dashboard,
      addToCart,
      decreaseCartItem,
      removeCartItem,
      placeOrder,
      updateStock,
      advanceOrderStatus,
    }),
    [
      menus,
      cart,
      cartTotal,
      orders,
      dashboard,
      addToCart,
      decreaseCartItem,
      removeCartItem,
      placeOrder,
      updateStock,
      advanceOrderStatus,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
