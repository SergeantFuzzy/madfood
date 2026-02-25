import { WeeklyPlan } from "../../lib/dbTypes";
import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "../../lib/date";
import { supabase } from "../../lib/supabaseClient";

export const listPlansForMonth = async (monthDate: Date): Promise<WeeklyPlan[]> => {
  const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const end = format(endOfMonth(monthDate), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("weekly_plans")
    .select("*")
    .gte("planned_date", start)
    .lte("planned_date", end)
    .order("planned_date", { ascending: true });

  if (error) throw error;
  return data;
};

export const savePlanForDay = async (payload: {
  planned_date: string;
  meal_name: string | null;
  recipe_id: string | null;
}) => {
  const cleanMeal = payload.meal_name?.trim() || null;

  if (!cleanMeal && !payload.recipe_id) {
    const { error } = await supabase
      .from("weekly_plans")
      .delete()
      .eq("planned_date", payload.planned_date)
      .eq("slot", "main");
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("weekly_plans").upsert(
    {
      planned_date: payload.planned_date,
      slot: "main",
      meal_name: cleanMeal,
      recipe_id: payload.recipe_id
    },
    {
      onConflict: "user_id,planned_date,slot"
    }
  );

  if (error) throw error;
};

export const getPlannedDaysThisWeek = async (): Promise<number> => {
  const now = new Date();
  const start = format(startOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd");
  const end = format(endOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("weekly_plans")
    .select("planned_date, meal_name, recipe_id")
    .gte("planned_date", start)
    .lte("planned_date", end);

  if (error) throw error;

  const uniqueDays = new Set(
    data
      .filter((item) => Boolean(item.meal_name) || Boolean(item.recipe_id))
      .map((item) => item.planned_date)
  );

  return uniqueDays.size;
};

export interface NextPlannedMealThisWeek {
  plannedDate: string;
  mealName: string;
}

interface WeeklyPlanSummaryRow {
  planned_date: string;
  meal_name: string | null;
  recipe_id: string | null;
}

export const getNextPlannedMealThisWeek = async (): Promise<NextPlannedMealThisWeek | null> => {
  const now = new Date();
  const start = format(now, "yyyy-MM-dd");
  const end = format(endOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("weekly_plans")
    .select("planned_date, meal_name, recipe_id")
    .eq("slot", "main")
    .gte("planned_date", start)
    .lte("planned_date", end)
    .order("planned_date", { ascending: true });

  if (error) throw error;

  const plans = (data ?? []) as WeeklyPlanSummaryRow[];
  const nextPlan = plans.find((item) => Boolean(item.meal_name?.trim()) || Boolean(item.recipe_id));
  if (!nextPlan) return null;

  if (nextPlan.meal_name?.trim()) {
    return {
      plannedDate: nextPlan.planned_date,
      mealName: nextPlan.meal_name.trim()
    };
  }

  if (!nextPlan.recipe_id) {
    return {
      plannedDate: nextPlan.planned_date,
      mealName: "Meal planned"
    };
  }

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("title")
    .eq("id", nextPlan.recipe_id)
    .maybeSingle();

  if (recipeError) throw recipeError;

  return {
    plannedDate: nextPlan.planned_date,
    mealName: recipe?.title?.trim() || "Recipe selected"
  };
};
