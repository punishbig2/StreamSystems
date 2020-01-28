export const sizeFormatter = (value: number | null): string => {
  if (value === null) return '';
  return value.toFixed(0);
};
