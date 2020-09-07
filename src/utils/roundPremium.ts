import { Validity } from "forms/validity";
import { Symbol } from "types/symbol";
import { toNumber } from "utils/isNumeric";
import { roundToNearest } from "utils/roundToNearest";

export const roundPremium = (
  value: number | null,
  symbol: Symbol
): number | null => {
  if (value === null) return null;
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
