export const normalizeExternalUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = trimmed;
  if (/^\/\//.test(normalized)) {
    normalized = `https:${normalized}`;
  } else if (!/^(https?:\/\/|data:|blob:)/i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    // Validate URL before rendering into links/images.
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
};
