import { Leg } from "components/MiddleOffice/interfaces/leg";
import { Validity } from "forms/validity";
import { Symbol } from "types/symbol";
import { getStyledValue } from "legsUtils";
import { toNumber } from "utils/isNumeric";
import { getRoundingPrecision, roundToNearest } from "utils/roundToNearest";

export const getStrikeValue = (
  leg: Leg,
  symbol: Symbol,
  name: keyof Leg
): any => {
  const numeric: number | null | undefined = toNumber(leg[name] as string);
  if (numeric === undefined || numeric === null) {
    return {
      value: null,
    };
  }
  const rounding: number | undefined = symbol["strike-rounding"];
  if (rounding === undefined) {
    return {
      value: null,
    };
  }
  const [value, validity] = roundToNearest(numeric, rounding);
  if (validity !== Validity.Valid) {
    return {
      value: null,
    };
  } else {
    return {
      value: value,
      precision: getRoundingPrecision(rounding),
      rounding: rounding,
    };
  }
};

export const getCurrencyValue = (
  leg: Leg,
  name: keyof Leg,
  style?: string
): any => {
  if (name === "premium" || name === "hedge") {
    return {
      value: getStyledValue(leg[name], style),
      currency: leg.premiumCurrency,
    };
  } else {
    return {
      value: leg[name],
      currency: leg.premiumCurrency,
    };
  }
};

export const getRatesValue = (leg: Leg, index: number): any => {
  const { rates } = leg;
  if (rates === null || rates === undefined) {
    throw new Error("cannot proceed with invalid rates");
  } else {
    const rate = rates[index];
    if (rate === undefined) return {};
    return { ...rate, label: rate.currency + " Rate" };
  }
};
