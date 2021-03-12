import { Product } from "types/product";
import { DealEntry } from "structures/dealEntry";

export const resolveStrategyDispute = (
  partial: Partial<DealEntry>,
  entry: DealEntry
): Product | undefined => {
  if (partial.strategy === undefined) {
    return entry.strategy;
  } else {
    return partial.strategy;
  }
};
