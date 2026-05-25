import { useEffect, useState } from 'react';
import Cart from '../components/Cart';
import MenuCard from '../components/MenuCard';
import { useApp } from '../hooks/useApp';

export default function OrderPage() {
  const { menus } = useApp();
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <main className="page order-page">
      <section className="menu-section" aria-label="커피 메뉴">
        <div className="menu-grid">
          {menus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} onNotify={setNotice} />
          ))}
        </div>
      </section>
      <Cart onNotify={setNotice} />

      {notice && (
        <div className="order-notice-wrap" role="status" aria-live="polite">
          <p className={`order-notice order-notice--${notice.type}`}>{notice.text}</p>
        </div>
      )}
    </main>
  );
}
