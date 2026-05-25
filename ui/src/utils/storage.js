import { INITIAL_MENUS } from '../data/menus';

const STORAGE_KEY = 'cozy-app-state';

function normalizeMenus(storedMenus) {
  if (!Array.isArray(storedMenus) || storedMenus.length === 0) {
    return INITIAL_MENUS.map((m) => ({ ...m }));
  }

  return INITIAL_MENUS.map((base) => {
    const saved = storedMenus.find((m) => m?.id === base.id);
    if (!saved) return { ...base };
    return {
      ...base,
      ...saved,
      id: base.id,
      name: saved.name || base.name,
      price: typeof saved.price === 'number' ? saved.price : base.price,
      stock: typeof saved.stock === 'number' ? saved.stock : base.stock,
      description: saved.description || base.description,
      image: saved.image ?? base.image,
    };
  });
}

function normalizeCart(cart) {
  if (!Array.isArray(cart)) return [];
  return cart.filter(
    (item) =>
      item &&
      item.key &&
      item.menuId &&
      item.name &&
      typeof item.unitPrice === 'number' &&
      typeof item.quantity === 'number' &&
      item.quantity > 0,
  );
}

function normalizeOrders(orders) {
  if (!Array.isArray(orders)) return [];
  return orders
    .filter((order) => order && order.id && Array.isArray(order.items))
    .map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      status: order.status ?? 'received',
      totalPrice: typeof order.totalPrice === 'number' ? order.totalPrice : 0,
    }))
    .filter((order) => !Number.isNaN(order.createdAt.getTime()));
}

export function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      menus: normalizeMenus(parsed.menus),
      cart: normalizeCart(parsed.cart),
      orders: normalizeOrders(parsed.orders),
    };
  } catch {
    return null;
  }
}

export function saveStoredState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable
  }
}

export function clearStoredState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
