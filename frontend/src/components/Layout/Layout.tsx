import { Link, Outlet, useLocation } from "react-router-dom";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Home", icon: "🏠" },
    { to: "/search", label: "Search", icon: "🔍" },
  ];

  return (
    <div className="app-shell">
      <main className="main-content">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`nav-item ${location.pathname === item.to ? "nav-item--active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
