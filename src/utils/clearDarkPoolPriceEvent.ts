export const clearDarkPoolPriceEvent = (
  symbol: string,
  strategy: string,
  tenor: string
): string => {
  return `ClearDarkPoolPrice.${symbol}.${strategy}.${tenor}`;
};
