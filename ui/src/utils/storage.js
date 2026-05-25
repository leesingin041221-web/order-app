const CART_KEY = 'cozy-cart';

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // ignore
  }
}

export function clearStoredState() {
  try {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem('cozy-app-state');
  } catch {
    // ignore
  }
}
