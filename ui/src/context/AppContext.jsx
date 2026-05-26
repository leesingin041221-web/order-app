import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  advanceOrderStatus as apiAdvanceOrder,
  createOrder,
  getMenus,
  getOrders,
  updateMenuStock,
  updateOrderStatus as apiUpdateOrderStatus,
  resetOrders as apiResetOrders,
} from '../api/client';
import { loadCart, saveCart } from '../utils/storage';
import { StoreContext } from './storeContext';

const MAX_STOCK = 99;

function cartLineKey(menuId, optionIds) {
  return `${menuId}:${[...optionIds].sort().join(',')}`;
}

function formatOptions(optionIds, menuOptions) {
  if (!optionIds.length) return '';
  const labels = optionIds.map((id) => {
    const opt = menuOptions?.find((o) => o.id === id);
    return opt?.name ?? opt?.label ?? id;
  });
  return ` (${labels.join(', ')})`;
}

function calcOptionExtra(optionIds, menuOptions) {
  return optionIds.reduce((sum, id) => {
    const opt = menuOptions?.find((o) => o.id === id);
    return sum + (opt?.price ?? 0);
  }, 0);
}

function cartQtyForMenu(cart, menuId) {
  return cart
    .filter((item) => item.menuId === menuId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function AppProvider({ children }) {
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState(loadCart);
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState({
    total: 0,
    received: 0,
    making: 0,
    done: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const refreshMenus = useCallback(async () => {
    const data = await getMenus(true);
    setMenus(data);
    return data;
  }, []);

  const refreshOrders = useCallback(async () => {
    const data = await getOrders();
    setOrders(data.orders);
    setDashboard(data.dashboard);
    return data;
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshMenus(), refreshOrders()]);
  }, [refreshMenus, refreshOrders]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        await refreshAll();
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? '서버에 연결할 수 없습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [refreshAll]);

  const addToCart = useCallback(
    (menuId, selectedOptions) => {
      const menu = menus.find((m) => m.id === menuId);
      if (!menu || menu.stock < 1) return { ok: false, reason: 'soldout' };

      const inCart = cartQtyForMenu(cart, menuId);
      if (inCart >= menu.stock) {
        return { ok: false, reason: 'stock' };
      }

      const optionIds = selectedOptions.filter((id) => id);
      const unitPrice = menu.price + calcOptionExtra(optionIds, menu.options);
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
            optionLabel: formatOptions(optionIds, menu.options),
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

  const placeOrder = useCallback(async () => {
    if (cart.length === 0) return { ok: false, message: '장바구니가 비었습니다.' };

    try {
      await createOrder(cart);
      setCart([]);
      await refreshAll();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message ?? '주문에 실패했습니다.' };
    }
  }, [cart, refreshAll]);

  const updateStock = useCallback(
    async (menuId, delta) => {
      await updateMenuStock(menuId, delta);
      await refreshMenus();
    },
    [refreshMenus],
  );

  const advanceOrderStatus = useCallback(
    async (orderId) => {
      await apiAdvanceOrder(orderId);
      await refreshOrders();
    },
    [refreshOrders],
  );

  const setOrderStatus = useCallback(
    async (orderId, status) => {
      try {
        await apiUpdateOrderStatus(orderId, status);
      } finally {
        await refreshOrders();
      }
    },
    [refreshOrders],
  );

  const resetOrders = useCallback(async () => {
    try {
      const data = await apiResetOrders();
      setOrders(data.orders);
      setDashboard(data.dashboard);
    } finally {
      await refreshOrders();
    }
  }, [refreshOrders]);

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
      loading,
      error,
      refreshMenus,
      refreshOrders,
      addToCart,
      decreaseCartItem,
      removeCartItem,
      placeOrder,
      updateStock,
      advanceOrderStatus,
      setOrderStatus,
      resetOrders,
    }),
    [
      menus,
      cart,
      cartTotal,
      orders,
      dashboard,
      loading,
      error,
      refreshMenus,
      refreshOrders,
      addToCart,
      decreaseCartItem,
      removeCartItem,
      placeOrder,
      updateStock,
      advanceOrderStatus,
      setOrderStatus,
      resetOrders,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
