import { Recipe, RecipeIngredient, RecipeWithIngredients } from "../../lib/dbTypes";
import { supabase } from "../../lib/supabaseClient";

interface IngredientInput {
  name: string;
  quantity?: string;
  unit?: string;
}

interface SaveRecipePayload {
  id?: string;
  title: string;
  notes?: string;
  image_url?: string;
  ingredients: IngredientInput[];
}

export const listRecipes = async (): Promise<RecipeWithIngredients[]> => {
  const { data: recipes, error: recipeError } = await supabase
    .from("recipes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (recipeError) throw recipeError;
  if (!recipes.length) return [];

  const recipeIds = recipes.map((recipe: Recipe) => recipe.id);
  const { data: ingredients, error: ingredientError } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .in("recipe_id", recipeIds)
    .order("sort_order", { ascending: true });

  if (ingredientError) throw ingredientError;

  const ingredientMap = ingredients.reduce<Record<string, RecipeIngredient[]>>((acc, ingredient: RecipeIngredient) => {
    if (!acc[ingredient.recipe_id]) acc[ingredient.recipe_id] = [];
    acc[ingredient.recipe_id].push(ingredient);
    return acc;
  }, {});

  return recipes.map((recipe: Recipe) => ({
    ...recipe,
    ingredients: ingredientMap[recipe.id] ?? []
  }));
};

export const saveRecipe = async (payload: SaveRecipePayload): Promise<RecipeWithIngredients> => {
  const recipePayload = {
    title: payload.title.trim(),
    notes: payload.notes?.trim() || null,
    image_url: payload.image_url?.trim() || null
  };

  const upsertPayload = payload.id ? { id: payload.id, ...recipePayload } : recipePayload;

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .upsert(upsertPayload)
    .select("*")
    .single();

  if (recipeError) throw recipeError;

  const { error: deleteError } = await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipe.id);
  if (deleteError) throw deleteError;

  const cleanIngredients = payload.ingredients
    .map((ingredient) => ({
      name: ingredient.name.trim(),
      quantity: ingredient.quantity?.trim() || null,
      unit: ingredient.unit?.trim() || null
    }))
    .filter((ingredient) => ingredient.name.length > 0);

  let savedIngredients: RecipeIngredient[] = [];

  if (cleanIngredients.length > 0) {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .insert(
        cleanIngredients.map((ingredient, index) => ({
          recipe_id: recipe.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          sort_order: index
        }))
      )
      .select("*");

    if (error) throw error;
    savedIngredients = data;
  }

  return {
    ...recipe,
    ingredients: savedIngredients
  };
};

export const deleteRecipe = async (recipeId: string) => {
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
  if (error) throw error;
};

export const uploadRecipeImage = async (file: File): Promise<string> => {
  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("recipe-images").upload(filePath, file, {
    upsert: false
  });
  if (error) throw error;

  const { data } = supabase.storage.from("recipe-images").getPublicUrl(filePath);
  return data.publicUrl;
};
