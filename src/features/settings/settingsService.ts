import { Profile } from "../../lib/dbTypes";
import { endOfWeek, format } from "../../lib/date";
import { supabase } from "../../lib/supabaseClient";

export const getProfile = async (): Promise<Profile | null> => {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data;
};

export const upsertProfile = async (payload: {
  display_name: string | null;
  phone_number: string | null;
  text_reminders_enabled: boolean;
}): Promise<Profile> => {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        display_name: payload.display_name,
        phone_number: payload.phone_number,
        text_reminders_enabled: payload.text_reminders_enabled
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

interface ReminderMeal {
  label: string;
  plannedDate: string;
  estimatedCost: number;
}

interface ReminderPreview {
  phoneNumber: string;
  message: string;
}

const parseNumericQuantity = (value: string | null): number => {
  if (!value) return 1;
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return parsed;
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

export const buildWeeklyReminderPreview = async (): Promise<ReminderPreview> => {
  const profile = await getProfile();
  if (!profile?.phone_number?.trim()) throw new Error("Add a phone number in settings first.");
  if (!profile.text_reminders_enabled) throw new Error("Enable text reminders before sending.");

  const now = new Date();
  const start = format(now, "yyyy-MM-dd");
  const end = format(endOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd");

  const { data: plans, error: planError } = await supabase
    .from("weekly_plans")
    .select("planned_date, meal_name, recipe_id, estimated_cost")
    .eq("slot", "main")
    .gte("planned_date", start)
    .lte("planned_date", end)
    .order("planned_date", { ascending: true });
  if (planError) throw planError;

  const recipeIds = Array.from(new Set((plans ?? []).map((item) => item.recipe_id).filter(Boolean)));
  const { data: recipes, error: recipeError } = recipeIds.length
    ? await supabase.from("recipes").select("id, title").in("id", recipeIds)
    : { data: [], error: null };
  if (recipeError) throw recipeError;

  const { data: recipeIngredients, error: ingredientError } = recipeIds.length
    ? await supabase.from("recipe_ingredients").select("recipe_id, name, quantity").in("recipe_id", recipeIds)
    : { data: [], error: null };
  if (ingredientError) throw ingredientError;

  const { data: shoppingItems, error: shoppingError } = await supabase
    .from("grocery_list_items")
    .select("name, quantity, price, already_have_in_pantry, purchased")
    .order("updated_at", { ascending: false });
  if (shoppingError) throw shoppingError;

  const { data: pantryItems, error: pantryError } = await supabase.from("pantry_items").select("name, estimated_price, in_stock");
  if (pantryError) throw pantryError;

  const recipeTitleById = new Map((recipes ?? []).map((item) => [item.id as string, item.title as string]));
  const ingredientByRecipeId = (recipeIngredients ?? []).reduce<Record<string, { name: string; quantity: string | null }[]>>((acc, item) => {
    const key = item.recipe_id as string;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ name: item.name as string, quantity: (item.quantity as string | null) ?? null });
    return acc;
  }, {});

  const unitPriceByIngredient = new Map<string, number>();
  (pantryItems ?? []).forEach((item) => {
    const key = normalizeKey(item.name as string);
    if (!unitPriceByIngredient.has(key) && Number(item.estimated_price) > 0) {
      unitPriceByIngredient.set(key, Number(item.estimated_price));
    }
  });
  (shoppingItems ?? []).forEach((item) => {
    const key = normalizeKey(item.name as string);
    if (!unitPriceByIngredient.has(key) && Number(item.price) > 0) {
      unitPriceByIngredient.set(key, Number(item.price));
    }
  });

  const meals: ReminderMeal[] = (plans ?? []).map((plan) => {
    const fallbackLabel = (plan.meal_name as string | null)?.trim() || "Meal planned";
    const label = (plan.recipe_id ? recipeTitleById.get(plan.recipe_id as string) : null) || fallbackLabel;
    const recipeIngredientsForPlan = plan.recipe_id ? ingredientByRecipeId[plan.recipe_id as string] ?? [] : [];
    const inferredCost = recipeIngredientsForPlan.reduce((sum, ingredient) => {
      const ingredientCost = unitPriceByIngredient.get(normalizeKey(ingredient.name));
      if (!ingredientCost) return sum;
      return sum + ingredientCost * parseNumericQuantity(ingredient.quantity);
    }, 0);

    return {
      label,
      plannedDate: plan.planned_date as string,
      estimatedCost: inferredCost > 0 ? inferredCost : Number(plan.estimated_cost ?? 0)
    };
  });

  const ingredientsToShop = (shoppingItems ?? [])
    .filter((item) => !item.already_have_in_pantry && !item.purchased)
    .slice(0, 20)
    .map((item) => ({
      name: item.name as string,
      total: Number(item.quantity) * Number(item.price)
    }));

  const firstName = profile.display_name?.trim() || "there";
  const mealLines =
    meals.length > 0
      ? meals
          .map((meal) => `- ${meal.plannedDate}: ${meal.label} (${meal.estimatedCost > 0 ? `$${meal.estimatedCost.toFixed(2)}` : "cost TBD"})`)
          .join("\n")
      : "- No meals planned yet for this week.";

  const shoppingLines =
    ingredientsToShop.length > 0
      ? ingredientsToShop.map((item) => `- ${item.name} (${item.total > 0 ? `$${item.total.toFixed(2)}` : "cost TBD"})`).join("\n")
      : "- No pending ingredients to shop.";

  const message = [
    `Hi ${firstName}, this is your MadFood reminder for the week.`,
    "",
    "Upcoming meals:",
    mealLines,
    "",
    "Ingredients to shop:",
    shoppingLines
  ].join("\n");

  return {
    phoneNumber: profile.phone_number.trim(),
    message
  };
};

export const sendWeeklyReminderText = async (): Promise<{ message: string }> => {
  const preview = await buildWeeklyReminderPreview();
  const { data, error } = await supabase.functions.invoke("send-weekly-reminder", {
    body: { phoneNumber: preview.phoneNumber, message: preview.message }
  });

  if (error) throw error;
  return { message: data?.message ?? preview.message };
};
