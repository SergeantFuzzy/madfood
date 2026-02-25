import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { GroceryListItem, GroceryListWithItems } from "../../lib/dbTypes";
import { formatCurrency } from "../../lib/format";
import { deleteShoppingItem, renameShoppingList, saveShoppingItem } from "./shoppingService";

interface ShoppingListEditorProps {
  list: GroceryListWithItems;
  onRefresh: () => Promise<void>;
  onError: (message: string | null) => void;
}

export const ShoppingListEditor = ({ list, onRefresh, onError }: ShoppingListEditorProps) => {
  const [name, setName] = useState(list.name);
  const [newItemName, setNewItemName] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newPrice, setNewPrice] = useState("0");
  const [newAlreadyHave, setNewAlreadyHave] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(list.name);
  }, [list.id, list.name]);

  const onRename = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    onError(null);

    try {
      await renameShoppingList(list.id, name);
      await onRefresh();
    } catch (err) {
      const value = err as { message?: string };
      onError(value.message ?? "Failed to rename list");
    } finally {
      setSaving(false);
    }
  };

  const onAddItem = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    onError(null);

    try {
      await saveShoppingItem({
        list_id: list.id,
        name: newItemName,
        quantity: Number(newQuantity),
        price: Number(newPrice),
        already_have_in_pantry: newAlreadyHave
      });
      setNewItemName("");
      setNewQuantity("1");
      setNewPrice("0");
      setNewAlreadyHave(false);
      await onRefresh();
    } catch (err) {
      const value = err as { message?: string };
      onError(value.message ?? "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (
    item: GroceryListItem,
    updates: Partial<Pick<GroceryListItem, "quantity" | "price" | "already_have_in_pantry" | "purchased" | "purchased_at">>
  ) => {
    setSaving(true);
    onError(null);

    try {
      const nextAlreadyHave = updates.already_have_in_pantry ?? item.already_have_in_pantry;
      const nextPurchased = nextAlreadyHave ? false : updates.purchased ?? item.purchased;

      await saveShoppingItem({
        id: item.id,
        list_id: item.list_id,
        name: item.name,
        quantity: updates.quantity ?? item.quantity,
        price: updates.price ?? item.price,
        already_have_in_pantry: nextAlreadyHave,
        purchased: nextPurchased,
        purchased_at: nextPurchased ? updates.purchased_at ?? item.purchased_at : null
      });
      await onRefresh();
    } catch (err) {
      const maybeError = err as { message?: string };
      onError(maybeError.message ?? "Failed to update item");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setSaving(true);
    onError(null);

    try {
      await deleteShoppingItem(itemId);
      await onRefresh();
    } catch (err) {
      const value = err as { message?: string };
      onError(value.message ?? "Failed to delete item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <form className="inline-row" onSubmit={onRename}>
        <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
        <Button type="submit" loading={saving}>
          Rename
        </Button>
      </form>

      <form className="grid-3" onSubmit={onAddItem}>
        <label className="field">
          <span className="field-label">Item</span>
          <input
            className="input"
            value={newItemName}
            onChange={(event) => setNewItemName(event.target.value)}
            placeholder="Milk"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Quantity</span>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={newQuantity}
            onChange={(event) => setNewQuantity(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Price (USD)</span>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={newPrice}
            onChange={(event) => setNewPrice(event.target.value)}
            required
          />
        </label>

        <label className="inline-row">
          <input type="checkbox" checked={newAlreadyHave} onChange={(event) => setNewAlreadyHave(event.target.checked)} />
          <span className="help-text">Already in pantry</span>
        </label>

        <Button type="submit" loading={saving}>
          Add item
        </Button>
      </form>

      {list.items.length === 0 ? <p className="empty-state">No items yet for this list.</p> : null}

      <div className="stack">
        {list.items.map((item) => (
          <div key={item.id} className="card">
            <div className="section-head mb-035">
              <h3>{item.name}</h3>
              <Button variant="danger" onClick={() => removeItem(item.id)} loading={saving}>
                Delete
              </Button>
            </div>

            <div className="inline-row mb-055">
              <label className="inline-row">
                <input
                  type="checkbox"
                  checked={item.purchased}
                  disabled={item.already_have_in_pantry}
                  onChange={(event) =>
                    updateItem(item, {
                      purchased: event.target.checked,
                      purchased_at: event.target.checked ? new Date().toISOString() : null
                    })
                  }
                />
                <span className="help-text">Purchased</span>
              </label>

              <label className="inline-row">
                <input
                  type="checkbox"
                  checked={item.already_have_in_pantry}
                  onChange={(event) => updateItem(item, { already_have_in_pantry: event.target.checked, purchased: false, purchased_at: null })}
                />
                <span className="help-text">Already in pantry</span>
              </label>
            </div>

            <div className="grid-2">
              <label className="field">
                <span className="field-label">Quantity</span>
                <input
                  key={`${item.id}-quantity-${item.updated_at}`}
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.quantity}
                  onBlur={(event) => updateItem(item, { quantity: Number(event.target.value) })}
                />
              </label>

              <label className="field">
                <span className="field-label">Price (USD)</span>
                <input
                  key={`${item.id}-price-${item.updated_at}`}
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.price}
                  onBlur={(event) => updateItem(item, { price: Number(event.target.value) })}
                />
              </label>
            </div>

            <p className="muted mt-055">
              {item.already_have_in_pantry ? "From pantry" : "Line total"}: {formatCurrency(item.quantity * item.price)}
            </p>
          </div>
        ))}
      </div>

      <h3>Need to buy total: {formatCurrency(list.to_buy_total)}</h3>
      <p className="muted">Purchased total: {formatCurrency(list.purchased_total)}</p>
      <p className="muted">All item value: {formatCurrency(list.total)}</p>
    </div>
  );
};
