export const sizeFormatter = (value: number | null): string => {
  if (value === null || value === undefined)
    return '';
  return value.toFixed(0);
};
