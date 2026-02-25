import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { formatCurrency } from "../../lib/format";
import { listFavoriteMeals } from "../planner/plannerService";
import { listFavoriteRecipes, listRecipes } from "../recipes/recipesService";

export const FavoritesPage = () => {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Awaited<ReturnType<typeof listFavoriteRecipes>>>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<Awaited<ReturnType<typeof listFavoriteMeals>>>([]);
  const [allRecipes, setAllRecipes] = useState<Awaited<ReturnType<typeof listRecipes>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recipeTitleById = useMemo(() => new Map(allRecipes.map((recipe) => [recipe.id, recipe.title])), [allRecipes]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recipes, meals, recipeIndex] = await Promise.all([listFavoriteRecipes(), listFavoriteMeals(), listRecipes()]);
        if (!active) return;
        setFavoriteRecipes(recipes);
        setFavoriteMeals(meals);
        setAllRecipes(recipeIndex);
      } catch (err) {
        const value = err as { message?: string };
        if (active) setError(value.message ?? "Failed to load favorites");
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container stack">
      <div className="page-header">
        <h1 className="page-title inline-row">
          Favorites
          <Star size={18} className="favorite-star-filled" />
        </h1>
        <p className="page-subtitle">Your starred recipes and favorite planned meals in one place.</p>
      </div>

      {loading ? <Loading label="Loading favorites..." /> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading ? (
        <Card>
          <div className="section-head">
            <h2>Favorite recipes</h2>
            <span className="badge">{favoriteRecipes.length}</span>
          </div>

          {favoriteRecipes.length === 0 ? <p className="empty-state">No favorite recipes yet.</p> : null}
          <div className="stack">
            {favoriteRecipes.map((recipe) => (
              <Link key={recipe.id} to={`/recipes?recipeId=${recipe.id}`} className="card text-none">
                <div className="section-head mb-04">
                  <h3 className="inline-row">
                    {recipe.title}
                    <Star size={14} className="favorite-star-filled" />
                  </h3>
                </div>
                {recipe.prep_time_minutes || recipe.cook_time_minutes ? (
                  <p className="muted mb-04">
                    {recipe.prep_time_minutes ? `Prep ${recipe.prep_time_minutes}m` : null}
                    {recipe.prep_time_minutes && recipe.cook_time_minutes ? " | " : null}
                    {recipe.cook_time_minutes ? `Cook ${recipe.cook_time_minutes}m` : null}
                  </p>
                ) : null}
                <p className="muted">{recipe.ingredients.length} ingredient(s)</p>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      {!loading ? (
        <Card>
          <div className="section-head">
            <h2>Favorite meals</h2>
            <span className="badge">{favoriteMeals.length}</span>
          </div>

          {favoriteMeals.length === 0 ? <p className="empty-state">No favorite planned meals yet.</p> : null}
          <div className="stack">
            {favoriteMeals.map((meal) => {
              const label = (meal.recipe_id ? recipeTitleById.get(meal.recipe_id) : null) || meal.meal_name || "Meal planned";
              return (
                <Link key={meal.id} to={`/planner?date=${meal.planned_date}`} className="card text-none">
                  <div className="section-head mb-04">
                    <h3 className="inline-row">
                      {label}
                      <Star size={14} className="favorite-star-filled" />
                    </h3>
                  </div>
                  <p className="muted mb-04">{meal.planned_date}</p>
                  <p className="muted">Estimated meal cost: {formatCurrency(meal.estimated_cost)}</p>
                </Link>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
};

