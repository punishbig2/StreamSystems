import { Validity } from "forms/validity";
import moStore from "mobx/stores/moStore";
import { Symbol } from "types/symbol";
import { toNumber } from "utils/isNumeric";
import { getRoundingPrecision, roundToNearest } from "utils/roundToNearest";

export const getPremiumPrecision = (ccypair: string): number => {
  const symbol: Symbol | undefined = moStore.findSymbolById(ccypair, false);
  if (symbol === undefined) return 0;
  const rounding: number | undefined = symbol["premium-rounding"];
  if (rounding === undefined) return 0;
  return getRoundingPrecision(rounding);
};

export const roundPremium = (
  value: number | null,
  ccypair: string
): number | null => {
  if (value === null) return null;
  const symbol: Symbol | undefined = moStore.findSymbolById(ccypair, false);
  if (symbol === undefined) return value;
  const rounding: number | undefined = symbol["premium-rounding"];
  if (rounding === undefined) return value;
  const [displayValue, validity] = roundToNearest(
    value,
    symbol["premium-rounding"]
  );
  if (validity === Validity.Valid) {
    const numeric: number | undefined = toNumber(displayValue);
    if (numeric === undefined) return value;
    return numeric;
  } else {
    return value;
  }
};
