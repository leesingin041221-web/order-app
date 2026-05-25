import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <span className="logo">COZY</span>
      <nav className="nav" aria-label="메인 메뉴">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? 'nav-btn nav-btn--filled' : 'nav-btn'
          }
        >
          주문하기
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            isActive ? 'nav-btn nav-btn--filled' : 'nav-link'
          }
        >
          관리자
        </NavLink>
      </nav>
    </header>
  );
}
