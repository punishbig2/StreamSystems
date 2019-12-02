export const priceFormatter = (value: number | null): string => {
  if (value === null)
    return '';
  if (typeof value.toFixed !== 'function') {
    return '';
  }
  const initial: string = value.toFixed(3);
  if (initial.charAt(initial.length - 1) === '0')
    return initial.substr(0, initial.length - 1);
  return initial;
};
