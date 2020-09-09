import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import moStore from "mobx/stores/moStore";

export const getDefaultStrikeForStrategy = (name: string): string => {
  const strategy: MOStrategy | undefined = moStore.getStrategyById(name);
  if (strategy === undefined) return "";
  if (strategy.strike === undefined) return "";
  return strategy.strike;
};
