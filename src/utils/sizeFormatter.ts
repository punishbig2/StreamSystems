export const sizeFormatter = (value: number | null): string => {
  if (value === null || value === undefined || value === 0)
    return '';
  return value.toFixed(0);
};
