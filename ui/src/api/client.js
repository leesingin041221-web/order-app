const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error ?? `요청 실패 (${res.status})`);
  }

  return data;
}

export function mapMenuFromApi(menu) {
  return {
    id: menu.id,
    name: menu.name,
    description: menu.description,
    price: menu.price,
    stock: menu.stock ?? 0,
    image: menu.image_url,
    is_available: menu.is_available ?? menu.stock > 0,
    options: (menu.options ?? []).map((o) => ({
      id: o.id,
      label: o.name,
      name: o.name,
      price: o.price,
    })),
  };
}

export async function getMenus(includeStock = true) {
  const query = includeStock ? '?include=stock' : '';
  const data = await apiFetch(`/menus${query}`);
  return data.map(mapMenuFromApi);
}

export async function getOrders() {
  return apiFetch('/orders');
}

export async function createOrder(items) {
  return apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({
      items: items.map((item) => ({
        menu_id: item.menuId,
        quantity: item.quantity,
        option_ids: item.optionIds ?? [],
      })),
    }),
  });
}

export async function updateMenuStock(menuId, delta) {
  return apiFetch(`/menus/${menuId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ delta }),
  });
}

export async function advanceOrderStatus(orderId) {
  return apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

export async function updateOrderStatus(orderId, status) {
  return apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function resetOrders() {
  return apiFetch('/orders', { method: 'DELETE' });
}
