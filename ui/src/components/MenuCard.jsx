import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { formatOptionPrice, formatPrice } from '../utils/formatPrice';

function buildDefaultOptions(menuOptions) {
  return Object.fromEntries((menuOptions ?? []).map((o) => [o.id, false]));
}

export default function MenuCard({ menu, onNotify }) {
  const { addToCart } = useApp();
  const menuOptions = useMemo(() => menu.options ?? [], [menu.options]);
  const [options, setOptions] = useState(() => buildDefaultOptions(menuOptions));
  const [added, setAdded] = useState(false);
  const addedTimerRef = useRef(null);

  useEffect(() => {
    setOptions(buildDefaultOptions(menuOptions));
  }, [menu.id, menuOptions]);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    };
  }, []);

  const toggleOption = (id) => {
    setOptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = () => {
    const selected = menuOptions.filter((o) => options[o.id]).map((o) => o.id);
    const result = addToCart(menu.id, selected);
    if (!result.ok) {
      if (result.reason === 'stock') {
        onNotify?.({ type: 'error', text: '재고가 부족합니다.' });
      }
      return;
    }
    setAdded(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = window.setTimeout(() => setAdded(false), 600);
  };

  const soldOut = menu.stock < 1;

  return (
    <article className="menu-card">
      <div className="menu-image">
        {menu.image ? (
          <img
            src={menu.image}
            alt={menu.name}
            className="menu-photo"
            loading="lazy"
          />
        ) : (
          <span className="placeholder-x" aria-hidden="true" />
        )}
      </div>
      <h3 className="menu-name">{menu.name}</h3>
      <p className="menu-price">{formatPrice(menu.price)}</p>
      <p className="menu-desc">{menu.description}</p>
      <fieldset className="menu-options">
        <legend className="visually-hidden">{menu.name} 옵션</legend>
        {menuOptions.map((opt) => (
          <label key={opt.id} className="option-label">
            <input
              type="checkbox"
              checked={!!options[opt.id]}
              onChange={() => toggleOption(opt.id)}
            />
            {opt.label ?? opt.name} ({formatOptionPrice(opt.price)})
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className={`btn btn-primary${added ? ' btn-primary--flash' : ''}`}
        onClick={handleAdd}
        disabled={soldOut}
      >
        {soldOut ? '품절' : added ? '담김' : '담기'}
      </button>
    </article>
  );
}
