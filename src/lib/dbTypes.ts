export type UUID = string;

export interface Profile {
  id: UUID;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: UUID;
  user_id: UUID;
  title: string;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: UUID;
  user_id: UUID;
  recipe_id: UUID;
  name: string;
  quantity: string | null;
  unit: string | null;
  sort_order: number;
  created_at: string;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[];
}

export interface Grocery {
  id: UUID;
  user_id: UUID;
  name: string;
  default_unit: string | null;
  created_at: string;
}

export interface GroceryList {
  id: UUID;
  user_id: UUID;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface GroceryListItem {
  id: UUID;
  user_id: UUID;
  list_id: UUID;
  name: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface GroceryListWithItems extends GroceryList {
  items: GroceryListItem[];
  total: number;
}

export interface WeeklyPlan {
  id: UUID;
  user_id: UUID;
  planned_date: string;
  slot: string;
  meal_name: string | null;
  recipe_id: UUID | null;
  created_at: string;
  updated_at: string;
}
