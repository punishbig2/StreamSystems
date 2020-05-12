export const currencyToNumber = (value: string) => {
  return 1000 * value.charCodeAt(0) + value.charCodeAt(3);
};

export const compareCurrencies = (s1: string | undefined, s2: string | undefined): number => {
  if (!s1 || !s2)
    return 0;
  return currencyToNumber(s1) - currencyToNumber(s2);
};
