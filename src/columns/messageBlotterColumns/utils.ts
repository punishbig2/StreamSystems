export const currencyToNumber = (value: string) => {
  return 1000 * value.charCodeAt(0) + value.charCodeAt(3);
};

export const compareCurrencyPairs = (
  s1: string | undefined,
  s2: string | undefined
): number => {
  if (!s1 || !s2) return 0;
  return currencyToNumber(s1) - currencyToNumber(s2);
};

export const toClassName = (source: string): string => {
  return source.replace(/\s/g, "-").toLowerCase();
};
