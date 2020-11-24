import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import { Symbol } from "types/symbol";

export const getVegaAdjust = (
  symbol: Symbol,
  strategy: MOStrategy
): boolean => {
  switch (strategy.OptionProductType) {
    case "Butterfly":
      return symbol.vegaAdjustBF;
    case "RiskReversal":
      return symbol.vegaAdjustRR;
    default:
      return false;
  }
};
