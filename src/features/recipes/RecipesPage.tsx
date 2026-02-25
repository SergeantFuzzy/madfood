import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { RecipeWithIngredients } from "../../lib/dbTypes";
import { normalizeExternalUrl } from "../../lib/url";
import { deleteRecipe, listRecipes, saveRecipe } from "./recipesService";
import { RecipeEditorModal, RecipeEditorValue } from "./RecipeEditorModal";

export const RecipesPage = () => {
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedImageKeys, setFailedImageKeys] = useState<Record<string, boolean>>({});

  const [editorOpen, setEditorOpen] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<RecipeWithIngredients | undefined>(undefined);

  const refreshRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRecipes();
      setRecipes(data);
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRecipes();
  }, []);

  const openCreate = () => {
    setActiveRecipe(undefined);
    setEditorOpen(true);
  };

  const openEdit = (recipe: RecipeWithIngredients) => {
    setActiveRecipe(recipe);
    setEditorOpen(true);
  };

  const onSave = async (value: RecipeEditorValue) => {
    setSaving(true);
    setError(null);

    try {
      await saveRecipe(value);
      setEditorOpen(false);
      await refreshRecipes();
    } catch (err) {
      const maybeError = err as { message?: string };
      setError(maybeError.message ?? "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (recipeId: string) => {
    const proceed = window.confirm("Delete this recipe?");
    if (!proceed) return;

    setError(null);

    try {
      await deleteRecipe(recipeId);
      await refreshRecipes();
    } catch (err) {
      const maybeError = err as { message?: string };
      setError(maybeError.message ?? "Failed to delete recipe");
    }
  };

  return (
    <div className="container stack">
      <div className="page-header">
        <h1 className="page-title">Recipes</h1>
        <p className="page-subtitle">Create and edit your meal recipes and ingredients.</p>
      </div>

      <Card>
        <div className="section-head">
          <h2>Your recipes</h2>
          <Button onClick={openCreate}>Add recipe</Button>
        </div>

        {loading ? <Loading label="Loading recipes..." /> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!loading && recipes.length === 0 ? <p className="empty-state">No recipes yet. Add your first one.</p> : null}

        <div className="stack">
          {recipes.map((recipe) => (
            <div className="card stack" key={recipe.id}>
              <div className="section-head mb-05">
                <div>
                  <h3>{recipe.title}</h3>
                  <p className="muted">{recipe.ingredients.length} ingredient(s)</p>
                </div>
                <div className="inline-row">
                  <Button variant="secondary" onClick={() => openEdit(recipe)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => onDelete(recipe.id)}>
                    Delete
                  </Button>
                </div>
              </div>

              {(() => {
                const normalizedImageUrl = recipe.image_url ? normalizeExternalUrl(recipe.image_url) : null;
                if (!normalizedImageUrl && recipe.image_url) {
                  return <p className="error-text recipe-image-meta">Image URL is invalid. Edit recipe to fix the link.</p>;
                }

                if (!normalizedImageUrl) return null;

                const imageKey = `${recipe.id}:${normalizedImageUrl}`;
                const showImage = !failedImageKeys[imageKey];

                return (
                  <div className="stack">
                    {showImage ? (
                      <a
                        href={normalizedImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="recipe-image-link"
                        aria-label={`Open ${recipe.title} image`}
                      >
                        <img
                          className="recipe-image"
                          src={normalizedImageUrl}
                          alt={recipe.title}
                          loading="lazy"
                          onError={() => setFailedImageKeys((prev) => ({ ...prev, [imageKey]: true }))}
                        />
                      </a>
                    ) : null}
                    <p className="muted recipe-image-meta">
                      Image link:{" "}
                      <a href={normalizedImageUrl} target="_blank" rel="noreferrer">
                        {normalizedImageUrl}
                      </a>
                    </p>
                  </div>
                );
              })()}

              {recipe.notes ? <p className="mb-055">{recipe.notes}</p> : null}

              {recipe.ingredients.length > 0 ? (
                <div className="inline-row">
                  {recipe.ingredients.map((ingredient) => (
                    <span className="badge" key={ingredient.id}>
                      {ingredient.name}
                      {ingredient.quantity ? ` (Qty: ${ingredient.quantity}${ingredient.unit ? ` ${ingredient.unit}` : ""})` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted">No ingredients added.</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <RecipeEditorModal
        open={editorOpen}
        recipe={activeRecipe}
        saving={saving}
        onClose={() => setEditorOpen(false)}
        onSave={onSave}
      />
    </div>
  );
};
