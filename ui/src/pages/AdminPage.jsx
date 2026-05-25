import { ORDER_STATUS } from '../data/menus';
import { useApp } from '../hooks/useApp';
import { formatPrice } from '../utils/formatPrice';

function formatDate(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function orderSummary(items) {
  return items.map((i) => `${i.name}${i.optionLabel} x ${i.quantity}`).join(', ');
}

export default function AdminPage() {
  const { menus, orders, dashboard, updateStock, advanceOrderStatus } = useApp();

  return (
    <main className="page admin-page">
      <section className="admin-panel admin-panel--dashboard">
        <h2 className="panel-title">관리자 대시보드</h2>
        <p className="dashboard-stats">
          총 주문 {dashboard.total} / 주문 접수 {dashboard.received} / 제조 중{' '}
          {dashboard.making} / 제조 완료 {dashboard.done}
        </p>
      </section>

      <section className="admin-panel">
        <h2 className="panel-title">재고 현황</h2>
        <div className="inventory-grid">
          {menus.map((menu) => (
            <div key={menu.id} className="inventory-card">
              <p className="inventory-name">{menu.name}</p>
              <p className="inventory-count">{menu.stock}개</p>
              <div className="stock-buttons">
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="재고 감소"
                  disabled={menu.stock <= 0}
                  onClick={() => updateStock(menu.id, -1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="재고 증가"
                  disabled={menu.stock >= 99}
                  onClick={() => updateStock(menu.id, 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <h2 className="panel-title">주문 현황</h2>
        {orders.length === 0 ? (
          <p className="cart-empty">주문이 없습니다.</p>
        ) : (
          <ul className="order-list">
            {orders.map((order) => {
              const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.received;
              return (
                <li key={order.id} className="order-row">
                  <div className="order-info">
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                    <span className="order-items">{orderSummary(order.items)}</span>
                    <span className="order-price">{formatPrice(order.totalPrice)}</span>
                  </div>
                  {status?.next ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => advanceOrderStatus(order.id)}
                    >
                      {status.action}
                    </button>
                  ) : (
                    <span className="status-done">{status.label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
