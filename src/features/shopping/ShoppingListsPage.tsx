import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Loading } from "../../components/ui/Loading";
import { GroceryListWithItems } from "../../lib/dbTypes";
import { createShoppingList, deleteShoppingList, listShoppingLists } from "./shoppingService";
import { ShoppingListEditor } from "./ShoppingListEditor";

export const ShoppingListsPage = () => {
  const [lists, setLists] = useState<GroceryListWithItems[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeList = useMemo(() => lists.find((list) => list.id === activeListId) ?? null, [activeListId, lists]);

  const refreshLists = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listShoppingLists();
      setLists(data);
      if (!activeListId && data[0]) setActiveListId(data[0].id);
      if (activeListId && !data.some((list) => list.id === activeListId)) {
        setActiveListId(data[0]?.id ?? null);
      }
    } catch (err) {
      const maybeError = err as { message?: string };
      setError(maybeError.message ?? "Failed to load shopping lists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLists();
  }, []);

  const onCreateList = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const created = await createShoppingList(newListName);
      setNewListName("");
      setActiveListId(created.id);
      await refreshLists();
    } catch (err) {
      const maybeError = err as { message?: string };
      setError(maybeError.message ?? "Failed to create list");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteActive = async () => {
    if (!activeList) return;
    const proceed = window.confirm(`Delete shopping list \"${activeList.name}\"?`);
    if (!proceed) return;

    setSaving(true);
    setError(null);

    try {
      await deleteShoppingList(activeList.id);
      await refreshLists();
    } catch (err) {
      const maybeError = err as { message?: string };
      setError(maybeError.message ?? "Failed to delete list");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container stack">
      <div className="page-header">
        <h1 className="page-title">Shopping Lists</h1>
        <p className="page-subtitle">Save multiple lists and track exact basket totals.</p>
      </div>

      <div className="grid-2 grid-align-start">
        <Card>
          <div className="section-head">
            <h2>Lists</h2>
            <span className="badge">{lists.length}</span>
          </div>

          <form className="stack" onSubmit={onCreateList}>
            <label className="field">
              <span className="field-label">New list name</span>
              <input
                className="input"
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                placeholder="Weekly groceries"
                required
              />
            </label>
            <Button type="submit" loading={saving}>
              Create list
            </Button>
          </form>

          <div className="stack mt-1">
            {loading ? <Loading label="Loading lists..." /> : null}
            {error ? <p className="error-text">{error}</p> : null}
            {!loading && lists.length === 0 ? <p className="empty-state">No lists yet. Create your first one.</p> : null}

            {lists.map((list) => (
              <button
                key={list.id}
                type="button"
                className={["card", "list-select-card", activeListId === list.id ? "active" : ""].join(" ").trim()}
                onClick={() => setActiveListId(list.id)}
              >
                <h3>{list.name}</h3>
                <p className="muted">
                  {list.items.length} item(s) | ${list.total.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          {!activeList ? (
            <p className="empty-state">Select a shopping list to edit items.</p>
          ) : (
            <>
              <div className="section-head">
                <h2>{activeList.name}</h2>
                <Button variant="danger" onClick={onDeleteActive} loading={saving}>
                  Delete list
                </Button>
              </div>
              <ShoppingListEditor list={activeList} onRefresh={refreshLists} onError={setError} />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
