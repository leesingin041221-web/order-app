import { useApp } from '../hooks/useApp';
import { formatPrice } from '../utils/formatPrice';

function formatDate(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));
}

function orderSummary(items) {
  return items.map((i) => `${i.name}${i.optionLabel} x ${i.quantity}`).join(', ');
}

export default function AdminPage() {
  const { menus, orders, dashboard, loading, error, updateStock, setOrderStatus, resetOrders } =
    useApp();

  const activeOrders = orders.filter((order) => order.status !== 'done');

  const handleStock = async (menuId, delta) => {
    try {
      await updateStock(menuId, delta);
    } catch {
      // ignore
    }
  };

  const handleSetStatus = (orderId, status) => {
    setOrderStatus(orderId, status);
  };

  const handleResetOrders = () => {
    if (!window.confirm('주문 현황을 모두 초기화할까요?')) return;
    resetOrders();
  };

  if (loading) {
    return (
      <main className="page admin-page">
        <p className="page-message">관리자 데이터를 불러오는 중...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page admin-page">
        <p className="page-message page-message--error">{error}</p>
      </main>
    );
  }

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
                  onClick={() => handleStock(menu.id, -1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="재고 증가"
                  disabled={menu.stock >= 99}
                  onClick={() => handleStock(menu.id, 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="admin-orders-block">
        <section className="admin-panel">
          <h2 className="panel-title">주문 현황</h2>
        {activeOrders.length === 0 ? (
          <p className="cart-empty">주문이 없습니다.</p>
        ) : (
          <ul className="order-list">
            {activeOrders.map((order) => (
                <li key={order.id} className="order-row">
                  <div className="order-info">
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                    <span className="order-items">{orderSummary(order.items)}</span>
                    <span className="order-price">
                      {formatPrice(
                        order.totalPrice ||
                          order.items?.reduce((s, i) => s + (i.subtotal || 0), 0),
                      )}
                    </span>
                  </div>
                  <div className="order-actions">
                    <button
                      type="button"
                      className={`order-status-banner order-status-banner--making${
                        order.status === 'making' ? ' order-status-banner--active' : ''
                      }`}
                      disabled={order.status === 'making'}
                      onClick={() => handleSetStatus(order.id, 'making')}
                    >
                      제조 중
                    </button>
                    <button
                      type="button"
                      className="order-status-banner order-status-banner--done"
                      onClick={() => handleSetStatus(order.id, 'done')}
                    >
                      제조 완료
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
        </section>
        <div className="order-reset-wrap">
          <button type="button" className="btn btn-primary btn-sm" onClick={handleResetOrders}>
            초기화
          </button>
        </div>
      </div>
    </main>
  );
}
