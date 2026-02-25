import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { RecipeWithIngredients } from "../../lib/dbTypes";

export interface EditableIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface RecipeEditorValue {
  id?: string;
  title: string;
  notes: string;
  image_url: string;
  ingredients: EditableIngredient[];
}

interface RecipeEditorModalProps {
  open: boolean;
  recipe?: RecipeWithIngredients;
  saving: boolean;
  onClose: () => void;
  onSave: (value: RecipeEditorValue) => Promise<void>;
}

const emptyIngredient = (): EditableIngredient => ({
  name: "",
  quantity: "",
  unit: ""
});

export const RecipeEditorModal = ({ open, recipe, saving, onClose, onSave }: RecipeEditorModalProps) => {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([emptyIngredient()]);

  useEffect(() => {
    if (!open) return;

    setTitle(recipe?.title ?? "");
    setNotes(recipe?.notes ?? "");
    setImageUrl(recipe?.image_url ?? "");
    setIngredients(
      recipe?.ingredients.length
        ? recipe.ingredients.map((ingredient) => ({
            name: ingredient.name,
            quantity: ingredient.quantity ?? "",
            unit: ingredient.unit ?? ""
          }))
        : [emptyIngredient()]
    );
  }, [open, recipe]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({
      id: recipe?.id,
      title,
      notes,
      image_url: imageUrl,
      ingredients
    });
  };

  const updateIngredient = (index: number, key: keyof EditableIngredient, value: string) => {
    setIngredients((prev) => prev.map((ingredient, i) => (i === index ? { ...ingredient, [key]: value } : ingredient)));
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyIngredient()];
    });
  };

  return (
    <Modal
      open={open}
      title={recipe ? "Edit recipe" : "Add recipe"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="recipe-editor-form" loading={saving}>
            Save recipe
          </Button>
        </>
      }
    >
      <form id="recipe-editor-form" className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Title</span>
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>

        <label className="field">
          <span className="field-label">Notes</span>
          <textarea
            className="textarea"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional instructions or notes"
          />
        </label>

        <label className="field">
          <span className="field-label">Image URL</span>
          <input
            className="input"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Optional image URL"
          />
          <span className="help-text">Storage upload is scaffolded via `recipe-images` bucket in the service layer.</span>
        </label>

        <div className="stack">
          <div className="section-head mb-0">
            <h3>Ingredients</h3>
            <Button type="button" variant="secondary" onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}>
              Add row
            </Button>
          </div>

          {ingredients.map((ingredient, index) => (
            <div className="grid-3" key={`ingredient-${index}`}>
              <label className="field">
                <span className="field-label">Name</span>
                <input
                  className="input"
                  value={ingredient.name}
                  onChange={(event) => updateIngredient(index, "name", event.target.value)}
                  placeholder="Ingredient"
                />
              </label>

              <label className="field">
                <span className="field-label">Quantity</span>
                <input
                  className="input"
                  value={ingredient.quantity}
                  onChange={(event) => updateIngredient(index, "quantity", event.target.value)}
                  placeholder="2"
                />
              </label>

              <label className="field">
                <span className="field-label">Unit</span>
                <div className="inline-row nowrap">
                  <input
                    className="input"
                    value={ingredient.unit}
                    onChange={(event) => updateIngredient(index, "unit", event.target.value)}
                    placeholder="cups"
                  />
                  <Button type="button" variant="danger" onClick={() => removeIngredient(index)}>
                    Remove
                  </Button>
                </div>
              </label>
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
};
