import { Product } from "types/product";
import moStore from "mobx/stores/moStore";

export const getDefaultStrikeForStrategy = (name: string): string => {
  const strategy: Product | undefined = moStore.getStrategyById(name);
  if (strategy === undefined) return "";
  if (strategy.strike === undefined) return "";
  return strategy.strike;
};
