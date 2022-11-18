import { Leg } from 'components/MiddleOffice/types/leg';
import { FXSymbol } from 'types/FXSymbol';
import { isStyledValue } from 'types/styledValue';
import { isNumeric } from 'utils/isNumeric';
import { getStyledValue } from 'utils/legsUtils';
import { getRoundingPrecision, roundToNearest } from 'utils/roundToNearest';

export const getStrikeValue = (leg: Leg, symbol: FXSymbol, name: keyof Leg): any => {
  const value: any = leg[name];
  if (value === undefined || value === null || value === 'N/A') {
    return { value: null, precision: 0, rounding: undefined };
  }
  // Otherwise, simply round it
  const rounding: number | undefined = symbol['strike-rounding'];
  if (rounding === undefined) {
    return { value: null, precision: 0, rounding: undefined };
  }
  if (!isNumeric(value)) {
    return {
      value: value,
      precision: 0,
      rounding: undefined,
    };
  }
  const [formattedValue] = roundToNearest(value, rounding);
  return {
    value: formattedValue,
    precision: getRoundingPrecision(rounding),
    rounding: rounding,
  };
};

export const getCurrencyValue = (
  leg: Leg,
  name: keyof Leg,
  symbol: FXSymbol,
  style?: string
): any => {
  const currencies: { [key: string]: string } = {
    premium: symbol.premiumCCY,
    hedge: symbol.riskCCY,
    gamma: symbol.riskCCY,
    vega: symbol.riskCCY,
  };
  const value: any = leg[name];
  if (isStyledValue(value)) {
    return {
      value: getStyledValue(value, style),
      currency: currencies[name],
    };
  }
  return {
    value: leg[name],
    currency: currencies[name],
  };
};

export const getRatesValue = (leg: Leg, index: number): any => {
  const { rates } = leg;
  if (rates === null || rates === undefined) {
    throw new Error('cannot proceed with invalid rates');
  } else {
    const rate = rates[index];
    if (rate === undefined) return {};
    return { ...rate, label: rate.currency + ' Rate' };
  }
};
