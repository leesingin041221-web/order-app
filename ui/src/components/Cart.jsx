import { useApp } from '../hooks/useApp';
import { formatPrice } from '../utils/formatPrice';

export default function Cart({ onNotify }) {
  const { cart, cartTotal, placeOrder, decreaseCartItem, removeCartItem } = useApp();

  const showNotice = (payload) => {
    if (onNotify) onNotify(payload);
  };

  const handleOrder = async () => {
    const result = await placeOrder();
    if (!result.ok) {
      showNotice({
        type: 'error',
        text: result.message ?? '주문에 실패했습니다.',
      });
      return;
    }
    showNotice({ type: 'success', text: '주문이 들어갔습니다' });
  };

  return (
    <section className="cart-panel" aria-label="장바구니">
      <h2 className="panel-title">장바구니</h2>
      {cart.length === 0 ? (
        <p className="cart-empty">메뉴를 선택한 뒤 담기를 눌러 주세요.</p>
      ) : (
        <ul className="cart-list">
          {cart.map((item) => (
            <li key={item.key} className="cart-row">
              <div className="cart-item-info">
                <span className="cart-item-name">
                  {item.name}
                  {item.optionLabel} X {item.quantity}
                </span>
                <span className="cart-item-price">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
              <div className="cart-item-actions">
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`${item.name} 수량 줄이기`}
                  onClick={() => decreaseCartItem(item.key)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="btn-icon btn-icon--remove"
                  aria-label={`${item.name} 삭제`}
                  onClick={() => removeCartItem(item.key)}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="cart-footer">
        <p className="cart-total">
          총 금액 <strong>{formatPrice(cartTotal)}</strong>
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOrder}
          disabled={cart.length === 0}
        >
          주문하기
        </button>
      </div>
    </section>
  );
}
