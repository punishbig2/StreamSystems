export const splitCurrencyPair = (symbol: string): [string, string] => {
  if (symbol.length !== 6) throw new Error("cannot split currency pair");
  return [symbol.slice(0, 3), symbol.slice(3)];
};
