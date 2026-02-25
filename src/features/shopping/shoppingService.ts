import { GroceryList, GroceryListItem, GroceryListWithItems } from "../../lib/dbTypes";
import { toTwoDecimals } from "../../lib/format";
import { supabase } from "../../lib/supabaseClient";

const computeTotal = (items: GroceryListItem[]): number => {
  return toTwoDecimals(items.reduce((sum, item) => sum + item.quantity * item.price, 0));
};

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
    acc[item.list_id].push(item);
    return acc;
  }, {});

  return lists.map((list: GroceryList) => {
    const listItems = itemMap[list.id] ?? [];
    return {
      ...list,
      items: listItems,
      total: computeTotal(listItems)
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
}

export const saveShoppingItem = async (payload: SaveItemPayload): Promise<GroceryListItem> => {
  const parsedQuantity = Number.isFinite(payload.quantity) ? payload.quantity : 0;
  const parsedPrice = Number.isFinite(payload.price) ? payload.price : 0;

  const itemPayload = payload.id
    ? {
        id: payload.id,
        list_id: payload.list_id,
        name: payload.name.trim(),
        quantity: toTwoDecimals(parsedQuantity),
        price: toTwoDecimals(parsedPrice)
      }
    : {
        list_id: payload.list_id,
        name: payload.name.trim(),
        quantity: toTwoDecimals(parsedQuantity),
        price: toTwoDecimals(parsedPrice)
      };

  const { data, error } = await supabase.from("grocery_list_items").upsert(itemPayload).select("*").single();
  if (error) throw error;
  return data;
};

export const deleteShoppingItem = async (itemId: string) => {
  const { error } = await supabase.from("grocery_list_items").delete().eq("id", itemId);
  if (error) throw error;
};
