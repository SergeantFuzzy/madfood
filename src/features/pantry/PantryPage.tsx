import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { PantryItem } from "../../lib/dbTypes";
import { formatCurrency } from "../../lib/format";
import { getCurrentWeekSpendTotal } from "../shopping/shoppingService";
import { deletePantryItem, listPantryItems, savePantryItem } from "./pantryService";

export const PantryPage = () => {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("0");
  const [inStock, setInStock] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekSpend, setWeekSpend] = useState(0);

  const inStockCount = useMemo(() => items.filter((item) => item.in_stock).length, [items]);
  const estimatedPantryValue = useMemo(
    () => items.filter((item) => item.in_stock).reduce((sum, item) => sum + item.quantity * item.estimated_price, 0),
    [items]
  );

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const [pantryItems, spend] = await Promise.all([listPantryItems(), getCurrentWeekSpendTotal()]);
      setItems(pantryItems);
      setWeekSpend(spend);
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to load pantry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onAdd = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await savePantryItem({
        name,
        quantity: Number(quantity),
        unit,
        estimated_price: Number(estimatedPrice),
        in_stock: inStock
      });
      setName("");
      setQuantity("1");
      setUnit("");
      setEstimatedPrice("0");
      setInStock(true);
      await refresh();
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to add pantry item");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (
    item: PantryItem,
    updates: Partial<Pick<PantryItem, "quantity" | "unit" | "estimated_price" | "in_stock">>
  ) => {
    setSaving(true);
    setError(null);

    try {
      await savePantryItem({
        id: item.id,
        name: item.name,
        quantity: updates.quantity ?? item.quantity,
        unit: updates.unit ?? item.unit ?? "",
        estimated_price: updates.estimated_price ?? item.estimated_price,
        in_stock: updates.in_stock ?? item.in_stock
      });
      await refresh();
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to update pantry item");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (itemId: string) => {
    setSaving(true);
    setError(null);

    try {
      await deletePantryItem(itemId);
      await refresh();
    } catch (err) {
      const value = err as { message?: string };
      setError(value.message ?? "Failed to delete pantry item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container stack">
      <div className="page-header">
        <h1 className="page-title">Pantry</h1>
        <p className="page-subtitle">Track what you already have and reduce duplicate grocery spending.</p>
      </div>

      <Card>
        <div className="section-head">
          <h2>Pantry summary</h2>
          <span className="badge">{inStockCount} in stock</span>
        </div>
        <p className="mb-04">Estimated pantry value: {formatCurrency(estimatedPantryValue)}</p>
        <p className="muted">Current week spend: {formatCurrency(weekSpend)}</p>
      </Card>

      <Card>
        <div className="section-head">
          <h2>Add pantry item</h2>
        </div>
        <form className="grid-3" onSubmit={onAdd}>
          <label className="field">
            <span className="field-label">Ingredient</span>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tomatoes" required />
          </label>

          <label className="field">
            <span className="field-label">Quantity</span>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Unit (optional)</span>
            <input className="input" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="oz, cups, each" />
          </label>

          <label className="field">
            <span className="field-label">Estimated unit price (USD)</span>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={estimatedPrice}
              onChange={(event) => setEstimatedPrice(event.target.value)}
              required
            />
          </label>

          <label className="inline-row">
            <input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} />
            <span className="help-text">Currently in stock</span>
          </label>

          <Button type="submit" loading={saving}>
            Add item
          </Button>
        </form>
      </Card>

      <Card>
        <div className="section-head">
          <h2>Your pantry items</h2>
          <span className="badge">{items.length}</span>
        </div>

        {loading ? <Loading label="Loading pantry..." /> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {!loading && items.length === 0 ? <p className="empty-state">No pantry items yet. Add your first ingredient.</p> : null}

        <div className="stack">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div className="section-head mb-035">
                <h3>{item.name}</h3>
                <Button type="button" variant="danger" loading={saving} onClick={() => onDelete(item.id)}>
                  Delete
                </Button>
              </div>

              <div className="grid-3">
                <label className="field">
                  <span className="field-label">Quantity</span>
                  <input
                    key={`${item.id}-qty-${item.updated_at}`}
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={item.quantity}
                    onBlur={(event) => updateItem(item, { quantity: Number(event.target.value) })}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Unit</span>
                  <input
                    key={`${item.id}-unit-${item.updated_at}`}
                    className="input"
                    defaultValue={item.unit ?? ""}
                    onBlur={(event) => updateItem(item, { unit: event.target.value })}
                  />
                </label>

                <label className="field">
                  <span className="field-label">Estimated unit price (USD)</span>
                  <input
                    key={`${item.id}-price-${item.updated_at}`}
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={item.estimated_price}
                    onBlur={(event) => updateItem(item, { estimated_price: Number(event.target.value) })}
                  />
                </label>
              </div>

              <div className="inline-row mt-055">
                <label className="inline-row">
                  <input type="checkbox" checked={item.in_stock} onChange={(event) => updateItem(item, { in_stock: event.target.checked })} />
                  <span className="help-text">In stock</span>
                </label>
                <span className="muted">Value: {formatCurrency(item.quantity * item.estimated_price)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

