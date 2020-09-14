import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import { DealEntry } from "structures/dealEntry";

export const resolveStrategyDispute = (
  partial: Partial<DealEntry>,
  entry: DealEntry
): MOStrategy | undefined => {
  if (partial.strategy === undefined) {
    return entry.strategy;
  } else {
    return partial.strategy;
  }
};
