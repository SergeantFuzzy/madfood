import { PantryItem } from "../../lib/dbTypes";
import { toTwoDecimals } from "../../lib/format";
import { supabase } from "../../lib/supabaseClient";

interface SavePantryItemPayload {
  id?: string;
  name: string;
  quantity: number;
  unit?: string;
  estimated_price: number;
  in_stock: boolean;
}

const parseMoney = (value: number) => toTwoDecimals(Number.isFinite(value) ? value : 0);

export const listPantryItems = async (): Promise<PantryItem[]> => {
  const { data, error } = await supabase
    .from("pantry_items")
    .select("*")
    .order("in_stock", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
};

export const savePantryItem = async (payload: SavePantryItemPayload): Promise<PantryItem> => {
  const cleanName = payload.name.trim();
  if (!cleanName) throw new Error("Pantry item name is required");

  const itemPayload = {
    id: payload.id,
    name: cleanName,
    quantity: parseMoney(payload.quantity),
    unit: payload.unit?.trim() || null,
    estimated_price: parseMoney(payload.estimated_price),
    in_stock: payload.in_stock
  };

  const upsertPayload = payload.id ? itemPayload : { ...itemPayload, id: undefined };
  const { data, error } = await supabase.from("pantry_items").upsert(upsertPayload).select("*").single();
  if (error) throw error;
  return data;
};

export const deletePantryItem = async (itemId: string) => {
  const { error } = await supabase.from("pantry_items").delete().eq("id", itemId);
  if (error) throw error;
};

export const hasInStockPantryMatch = async (name: string): Promise<boolean> => {
  const clean = name.trim();
  if (!clean) return false;

  const { data, error } = await supabase
    .from("pantry_items")
    .select("id")
    .ilike("name", clean)
    .eq("in_stock", true)
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
};

export const upsertPantryFromShoppingItem = async (payload: { name: string; quantity: number; estimated_price: number }) => {
  const clean = payload.name.trim();
  if (!clean) return;

  const { data: existing, error: existingError } = await supabase
    .from("pantry_items")
    .select("*")
    .ilike("name", clean)
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error } = await supabase
      .from("pantry_items")
      .update({
        quantity: parseMoney(Math.max(existing.quantity, payload.quantity)),
        estimated_price: payload.estimated_price > 0 ? parseMoney(payload.estimated_price) : existing.estimated_price,
        in_stock: true
      })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("pantry_items").insert({
    name: clean,
    quantity: parseMoney(payload.quantity),
    estimated_price: parseMoney(payload.estimated_price),
    in_stock: true
  });
  if (error) throw error;
};

