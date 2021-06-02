import { Product } from "types/product";

export const getDefaultStrikeForStrategy = (strategy: Product): string => {
  if (strategy.strike === undefined) return "";
  return strategy.strike;
};
