export const toNumberOrFallbackIfNaN = (
  value: string | null,
  fallback: number | null
) => {
  if (value === null) return null;
  const numeric: number = Number(value);
  if (isNaN(numeric)) return fallback;
  return numeric;
};
