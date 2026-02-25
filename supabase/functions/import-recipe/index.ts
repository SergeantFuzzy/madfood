import { corsHeaders } from "../_shared/cors.ts";

interface ParsedIngredient {
  name: string;
  quantity: string;
  unit: string;
}

const parseIngredient = (value: unknown): ParsedIngredient | null => {
  if (typeof value !== "string") return null;
  const line = value.trim();
  if (!line) return null;

  const match = line.match(/^([\d./]+)?\s*([a-zA-Z]+)?\s*(.*)$/);
  if (!match) return { name: line, quantity: "", unit: "" };

  const quantity = (match[1] ?? "").trim();
  const unit = (match[2] ?? "").trim();
  const name = (match[3] ?? "").trim() || line;

  return { name, quantity, unit };
};

const flattenJsonLd = (entry: unknown): unknown[] => {
  if (Array.isArray(entry)) return entry.flatMap(flattenJsonLd);
  if (entry && typeof entry === "object" && "@graph" in entry) {
    const graph = (entry as Record<string, unknown>)["@graph"];
    return flattenJsonLd(graph);
  }
  return [entry];
};

const extractRecipeObject = (html: string): Record<string, unknown> | null => {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptRegex)) {
    const scriptBody = match[1]?.trim();
    if (!scriptBody) continue;

    try {
      const parsed = JSON.parse(scriptBody);
      const flattened = flattenJsonLd(parsed);
      const recipeObject = flattened.find((item) => {
        if (!item || typeof item !== "object") return false;
        const type = (item as Record<string, unknown>)["@type"];
        if (typeof type === "string") return type.toLowerCase().includes("recipe");
        if (Array.isArray(type)) return type.some((value) => typeof value === "string" && value.toLowerCase().includes("recipe"));
        return false;
      });

      if (recipeObject && typeof recipeObject === "object") {
        return recipeObject as Record<string, unknown>;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const normalizeImageUrl = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  if (value && typeof value === "object" && typeof (value as Record<string, unknown>).url === "string") {
    return (value as Record<string, unknown>).url as string;
  }
  return "";
};

const parseDurationMinutes = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;

  const isoMatch = text.match(/^P(?:T(?:(\d+)H)?(?:(\d+)M)?)$/i);
  if (isoMatch) {
    const hours = Number(isoMatch[1] ?? "0");
    const minutes = Number(isoMatch[2] ?? "0");
    const total = hours * 60 + minutes;
    return Number.isFinite(total) ? total : null;
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric >= 0) return numeric;
  return null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await request.json();
    if (typeof url !== "string" || !url.trim()) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const targetUrl = url.trim();
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!(parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:")) {
      return new Response(JSON.stringify({ error: "Only http/https URLs are allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "MadFoodRecipeImporter/1.0"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch recipe page (${response.status})` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const html = await response.text();
    const recipe = extractRecipeObject(html);

    if (!recipe) {
      return new Response(JSON.stringify({ error: "No recipe metadata found on this page" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const title = typeof recipe.name === "string" ? recipe.name.trim() : "";
    const notes = typeof recipe.description === "string" ? recipe.description.trim() : "";
    const imageUrl = normalizeImageUrl(recipe.image);
    const prepTimeMinutes = parseDurationMinutes(recipe.prepTime);
    const cookTimeMinutes = parseDurationMinutes(recipe.cookTime);
    const ingredients = Array.isArray(recipe.recipeIngredient)
      ? recipe.recipeIngredient.map((item) => parseIngredient(item)).filter((item): item is ParsedIngredient => Boolean(item))
      : [];

    if (!title) {
      return new Response(JSON.stringify({ error: "Recipe title not found" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        title,
        notes,
        image_url: imageUrl,
        prep_time_minutes: prepTimeMinutes,
        cook_time_minutes: cookTimeMinutes,
        ingredients
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
