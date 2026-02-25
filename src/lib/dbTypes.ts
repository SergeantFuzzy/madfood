export type UUID = string;

export interface Profile {
  id: UUID;
  email: string;
  display_name: string | null;
  phone_number: string | null;
  text_reminders_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: UUID;
  user_id: UUID;
  title: string;
  notes: string | null;
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  is_favorite: boolean;
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
  already_have_in_pantry: boolean;
  purchased: boolean;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroceryListWithItems extends GroceryList {
  items: GroceryListItem[];
  total: number;
  to_buy_total: number;
  purchased_total: number;
}

export interface WeeklyPlan {
  id: UUID;
  user_id: UUID;
  planned_date: string;
  slot: string;
  meal_name: string | null;
  recipe_id: UUID | null;
  already_have_in_pantry: boolean;
  purchased: boolean;
  estimated_cost: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface PantryItem {
  id: UUID;
  user_id: UUID;
  name: string;
  quantity: number;
  unit: string | null;
  estimated_price: number;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}
