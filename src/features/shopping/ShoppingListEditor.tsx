import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { GroceryListWithItems } from "../../lib/dbTypes";
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
        price: Number(newPrice)
      });
      setNewItemName("");
      setNewQuantity("1");
      setNewPrice("0");
      await onRefresh();
    } catch (err) {
      const value = err as { message?: string };
      onError(value.message ?? "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (itemId: string, key: "quantity" | "price", value: number) => {
    setSaving(true);
    onError(null);

    const existing = list.items.find((item) => item.id === itemId);
    if (!existing) {
      setSaving(false);
      return;
    }

    try {
      await saveShoppingItem({
        id: existing.id,
        list_id: existing.list_id,
        name: existing.name,
        quantity: key === "quantity" ? value : existing.quantity,
        price: key === "price" ? value : existing.price
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
                  onBlur={(event) => updateItem(item.id, "quantity", Number(event.target.value))}
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
                  onBlur={(event) => updateItem(item.id, "price", Number(event.target.value))}
                />
              </label>
            </div>

            <p className="muted mt-055">
              Line total: {formatCurrency(item.quantity * item.price)}
            </p>
          </div>
        ))}
      </div>

      <h3>Total basket value: {formatCurrency(list.total)}</h3>
    </div>
  );
};
