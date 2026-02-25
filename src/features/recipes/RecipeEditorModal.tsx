import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { RecipeWithIngredients } from "../../lib/dbTypes";
import { normalizeExternalUrl } from "../../lib/url";
import { uploadRecipeImage } from "./recipesService";

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
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([emptyIngredient()]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle(recipe?.title ?? "");
    setNotes(recipe?.notes ?? "");
    setImageUrl(recipe?.image_url ?? "");
    setImageUploadError(null);
    setUploadingImage(false);
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

  useEffect(() => {
    setImagePreviewFailed(false);
  }, [imageUrl, open]);

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

  const onChooseImage = () => {
    if (uploadingImage || saving) return;
    fileInputRef.current?.click();
  };

  const onUploadImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageUploadError(null);
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadRecipeImage(file);
      setImageUrl(uploadedUrl);
      setImagePreviewFailed(false);
    } catch (err) {
      const value = err as { message?: string };
      setImageUploadError(value.message ?? "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyIngredient()];
    });
  };

  const previewImageUrl = normalizeExternalUrl(imageUrl);

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
          <input ref={fileInputRef} type="file" accept="image/*" className="display-none" onChange={onUploadImageFile} />
          <div className="inline-row">
            <Button type="button" variant="secondary" onClick={onChooseImage} disabled={saving || uploadingImage}>
              {uploadingImage ? "Uploading image..." : "Upload image"}
            </Button>
            <span className="help-text">Or paste a URL above.</span>
          </div>
          {imageUploadError ? <p className="error-text">{imageUploadError}</p> : null}
        </label>

        {previewImageUrl ? (
          <div className="stack">
            {!imagePreviewFailed ? (
              <img
                className="recipe-image-preview"
                src={previewImageUrl}
                alt="Recipe preview"
                loading="lazy"
                onError={() => setImagePreviewFailed(true)}
              />
            ) : (
              <p className="error-text">Image preview failed to load for this URL.</p>
            )}
            <p className="muted recipe-image-meta">
              Preview link:{" "}
              <a href={previewImageUrl} target="_blank" rel="noreferrer">
                {previewImageUrl}
              </a>
            </p>
          </div>
        ) : imageUrl.trim() ? (
          <p className="error-text">Image URL looks invalid. Use a full URL like `https://...`</p>
        ) : null}

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
                <div className="inline-row">
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
