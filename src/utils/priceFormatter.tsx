export const priceFormatter = (value: number | null): string => {
  if (value === null)
    return '';
  if (typeof value.toFixed !== 'function') {
    return '';
  }
  return value.toFixed(3);
};
