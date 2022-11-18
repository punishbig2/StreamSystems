import { Validity } from 'forms/validity';
import { FXSymbol } from 'types/FXSymbol';
import { toNumber } from 'utils/isNumeric';
import { roundToNearest } from 'utils/roundToNearest';

export const roundPremium = (value: number | null, symbol: FXSymbol | undefined): number | null => {
  if (symbol === undefined) return value;
  if (value === null) return null;
  const rounding: number | undefined = symbol['premium-rounding'];
  if (rounding === undefined) return value;
  const [displayValue, validity] = roundToNearest(value, rounding);
  if (validity === Validity.Valid) {
    const numeric: number | null | undefined = toNumber(displayValue);
    if (numeric === undefined || numeric === null) return value;
    return numeric;
  } else {
    return value;
  }
};
