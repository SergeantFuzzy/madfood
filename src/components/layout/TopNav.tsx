import { Search, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { searchRecipesByTitle, type RecipeSearchSuggestion } from "../../features/recipes/recipesService";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/planner", label: "Planner" },
  { to: "/recipes", label: "Recipes" },
  { to: "/shopping-lists", label: "Shopping Lists" },
  { to: "/pantry", label: "Pantry" },
  { to: "/settings", label: "Settings" }
];

const logoSrc = `${import.meta.env.BASE_URL}logo-mark.png?v=20260225`;

export const TopNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<RecipeSearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!user || !searchValue.trim()) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchRecipesByTitle(searchValue);
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchValue, user]);

  const goToRecipe = (recipe: RecipeSearchSuggestion) => {
    setSearchValue(recipe.title);
    setShowSuggestions(false);
    setSuggestions([]);
    navigate(`/recipes?recipeId=${recipe.id}`);
  };

  return (
    <header className="topnav">
      <div className="container topnav-row">
        <Link to={user ? "/dashboard" : "/login"} className="brand" aria-label="MadFood home">
          <img src={logoSrc} className="brand-logo" alt="" aria-hidden="true" />
          <span>MadFood</span>
        </Link>

        {user ? (
          <div className="topnav-search-wrap">
            <div className="topnav-search-input-wrap">
              <Search size={16} className="topnav-search-icon" />
              <input
                className="topnav-search-input"
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                placeholder="Search meals/recipes..."
              />
            </div>
            {showSuggestions && searchValue.trim() ? (
              <div className="topnav-search-suggestions">
                {searching ? <p className="topnav-search-empty">Searching...</p> : null}
                {!searching && suggestions.length === 0 ? <p className="topnav-search-empty">No matches found.</p> : null}
                {!searching
                  ? suggestions.map((recipe) => (
                      <button key={recipe.id} type="button" className="topnav-search-item" onClick={() => goToRecipe(recipe)}>
                        <span>{recipe.title}</span>
                        <span className="topnav-search-created">
                          Created {new Date(recipe.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </button>
                    ))
                  : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="topnav-actions">
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

          {user ? (
            <NavLink
              to="/favorites"
              className={({ isActive }) => ["favorite-link", isActive ? "active" : ""].join(" ").trim()}
              aria-label="Open favorites"
            >
              <Star size={18} />
            </NavLink>
          ) : null}
        </div>
      </div>
    </header>
  );
};
