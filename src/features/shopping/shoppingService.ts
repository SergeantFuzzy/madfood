import { GroceryList, GroceryListItem, GroceryListWithItems } from "../../lib/dbTypes";
import { endOfWeek, format, startOfWeek } from "../../lib/date";
import { toTwoDecimals } from "../../lib/format";
import { supabase } from "../../lib/supabaseClient";
import { hasInStockPantryMatch, upsertPantryFromShoppingItem } from "../pantry/pantryService";

const computeTotal = (items: GroceryListItem[]): number => {
  return toTwoDecimals(items.reduce((sum, item) => sum + item.quantity * item.price, 0));
};

const computeToBuyTotal = (items: GroceryListItem[]): number => {
  return toTwoDecimals(items.filter((item) => !item.already_have_in_pantry).reduce((sum, item) => sum + item.quantity * item.price, 0));
};

const computePurchasedTotal = (items: GroceryListItem[]): number => {
  return toTwoDecimals(
    items.filter((item) => item.purchased && !item.already_have_in_pantry).reduce((sum, item) => sum + item.quantity * item.price, 0)
  );
};

const normalizeItem = (item: GroceryListItem): GroceryListItem => ({
  ...item,
  already_have_in_pantry: Boolean(item.already_have_in_pantry),
  purchased: Boolean(item.purchased),
  purchased_at: item.purchased_at ?? null
});

export const listShoppingLists = async (): Promise<GroceryListWithItems[]> => {
  const { data: lists, error: listError } = await supabase
    .from("grocery_lists")
    .select("*")
    .order("updated_at", { ascending: false });

  if (listError) throw listError;
  if (!lists.length) return [];

  const listIds = lists.map((list: GroceryList) => list.id);
  const { data: items, error: itemError } = await supabase
    .from("grocery_list_items")
    .select("*")
    .in("list_id", listIds)
    .order("created_at", { ascending: true });

  if (itemError) throw itemError;

  const itemMap = items.reduce<Record<string, GroceryListItem[]>>((acc, item: GroceryListItem) => {
    if (!acc[item.list_id]) acc[item.list_id] = [];
    acc[item.list_id].push(normalizeItem(item));
    return acc;
  }, {});

  return lists.map((list: GroceryList) => {
    const listItems = itemMap[list.id] ?? [];
    return {
      ...list,
      items: listItems,
      total: computeTotal(listItems),
      to_buy_total: computeToBuyTotal(listItems),
      purchased_total: computePurchasedTotal(listItems)
    };
  });
};

export const createShoppingList = async (name: string): Promise<GroceryList> => {
  const { data, error } = await supabase.from("grocery_lists").insert({ name: name.trim() }).select("*").single();
  if (error) throw error;
  return data;
};

export const renameShoppingList = async (id: string, name: string) => {
  const { error } = await supabase.from("grocery_lists").update({ name: name.trim() }).eq("id", id);
  if (error) throw error;
};

export const deleteShoppingList = async (id: string) => {
  const { error } = await supabase.from("grocery_lists").delete().eq("id", id);
  if (error) throw error;
};

interface SaveItemPayload {
  id?: string;
  list_id: string;
  name: string;
  quantity: number;
  price: number;
  already_have_in_pantry?: boolean;
  purchased?: boolean;
  purchased_at?: string | null;
}

export const saveShoppingItem = async (payload: SaveItemPayload): Promise<GroceryListItem> => {
  const parsedQuantity = Number.isFinite(payload.quantity) ? payload.quantity : 0;
  const parsedPrice = Number.isFinite(payload.price) ? payload.price : 0;
  const cleanName = payload.name.trim();
  if (!cleanName) throw new Error("Item name is required");

  const pantryMatch = payload.id ? false : await hasInStockPantryMatch(cleanName);
  const alreadyHave = payload.already_have_in_pantry ?? pantryMatch;
  const purchased = alreadyHave ? false : Boolean(payload.purchased);
  const purchasedAt = purchased ? payload.purchased_at ?? new Date().toISOString() : null;

  const itemPayload = payload.id
    ? {
        id: payload.id,
        list_id: payload.list_id,
        name: cleanName,
        quantity: toTwoDecimals(parsedQuantity),
        price: toTwoDecimals(parsedPrice),
        already_have_in_pantry: alreadyHave,
        purchased,
        purchased_at: purchasedAt
      }
    : {
        list_id: payload.list_id,
        name: cleanName,
        quantity: toTwoDecimals(parsedQuantity),
        price: toTwoDecimals(parsedPrice),
        already_have_in_pantry: alreadyHave,
        purchased,
        purchased_at: purchasedAt
      };

  const { data, error } = await supabase.from("grocery_list_items").upsert(itemPayload).select("*").single();
  if (error) throw error;

  if (alreadyHave) {
    await upsertPantryFromShoppingItem({
      name: cleanName,
      quantity: toTwoDecimals(parsedQuantity),
      estimated_price: toTwoDecimals(parsedPrice)
    });
  }

  return normalizeItem(data);
};

export const deleteShoppingItem = async (itemId: string) => {
  const { error } = await supabase.from("grocery_list_items").delete().eq("id", itemId);
  if (error) throw error;
};

export const getCurrentWeekSpendTotal = async (): Promise<number> => {
  const now = new Date();
  const start = `${format(startOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd")}T00:00:00.000Z`;
  const end = `${format(endOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd")}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from("grocery_list_items")
    .select("quantity, price, purchased, purchased_at, already_have_in_pantry")
    .eq("purchased", true)
    .gte("purchased_at", start)
    .lte("purchased_at", end);

  if (error) throw error;

  return toTwoDecimals(
    (data ?? [])
      .filter((item) => !item.already_have_in_pantry)
      .reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0)
  );
};
