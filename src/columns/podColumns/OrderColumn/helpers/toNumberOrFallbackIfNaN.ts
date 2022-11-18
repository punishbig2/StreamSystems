export const toNumberOrFallbackIfNaN = (
  value: string | number | null,
  fallback: number | null
): number | null => {
  if (typeof value === 'number') return value;
  if (value === null) return null;
  const numeric = Number(value);
  if (isNaN(numeric)) return fallback;
  return numeric;
};
