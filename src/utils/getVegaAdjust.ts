import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import { LegAdjustValue, UndefinedLegAdjustValue } from "types/legAdjustValue";
import { Symbol } from "types/symbol";

export const getVegaAdjust = (
  symbol: Symbol,
  strategy: MOStrategy
): LegAdjustValue => {
  switch (strategy.OptionProductType) {
    case "Butterfly":
      return symbol.vegaAdjustBF;
    case "RiskReversal":
      return symbol.vegaAdjustRR;
    default:
      return UndefinedLegAdjustValue;
  }
};
