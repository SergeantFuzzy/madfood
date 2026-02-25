import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/planner", label: "Planner" },
  { to: "/recipes", label: "Recipes" },
  { to: "/shopping-lists", label: "Shopping Lists" },
  { to: "/settings", label: "Settings" }
];

const logoSrc = `${import.meta.env.BASE_URL}logo-mark.png`;

export const TopNav = () => {
  const { user } = useAuth();

  return (
    <header className="topnav">
      <div className="container topnav-row">
        <Link to={user ? "/dashboard" : "/login"} className="brand" aria-label="MadFood home">
          <img src={logoSrc} className="brand-logo" alt="" aria-hidden="true" />
          <span>MadFood</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {user
            ? navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => ["nav-link", isActive ? "active" : ""].join(" ").trim()}
                >
                  {item.label}
                </NavLink>
              ))
            : (
                <NavLink to="/login" className={({ isActive }) => ["nav-link", isActive ? "active" : ""].join(" ").trim()}>
                  Login
                </NavLink>
              )}
        </nav>
      </div>
    </header>
  );
};
