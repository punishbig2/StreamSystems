import { Leg } from "components/MiddleOffice/types/leg";
import { getStyledValue } from "legsUtils";
import { DealEntry } from "structures/dealEntry";
import { Sides } from "types/sides";
import { Symbol } from "types/symbol";
import { isNumeric } from "utils/isNumeric";
import { getRoundingPrecision, roundToNearest } from "utils/roundToNearest";
import moment from "moment";
import { addTenorToDate } from "utils/tenorUtils";

export const mapToLeg = (
  entry: DealEntry,
  name: keyof DealEntry,
  leg: Leg,
  symbol: Symbol,
  legIndex: number
): [keyof Leg, any][] => {
  const value: any = entry[name];
  const tenor: string =
    legIndex === 1 && entry.tenor2 !== null ? entry.tenor2 : entry.tenor1;
  switch (name) {
    case "dealId":
    case "ccypair":
    case "tenor1":
    case "tenor2":
    case "legadj":
    case "style":
    case "model":
    case "strategy":
    case "legs":
    case "status":
    case "dealType":
    case "spread":
    case "type":
    case "premstyle":
    case "tradeDate":
    case "deltastyle":
      return [];
    case "tenor1expiry":
    case "tenor2expiry":
      const premiumDate: moment.Moment = moment(entry.tradeDate).add(
        symbol.SettlementWindow,
        "d"
      );
      const deliveryDate: moment.Moment = addTenorToDate(premiumDate, tenor);
      return [
        ["deliveryDate", deliveryDate],
        ["expiryDate", value],
        ["premiumDate", premiumDate],
      ];
    case "dealstrike":
      return [["strike", value]];
    case "vol":
      return [["vol", value]];
    case "not1":
      if (legIndex !== 1) {
        return [["notional", value]];
      }
      break;
    case "not2":
      if (legIndex === 1) {
        return [["notional", value]];
      }
      break;
    case "buyer":
      if (leg.side === Sides.Buy) {
        return [["party", value]];
      }
      break;
    case "seller":
      if (leg.side === Sides.Sell) {
        return [["party", value]];
      }
      break;
    case "deliveryDate":
      return [["deliveryDate", value]];
  }
  return [];
};

export const getStrikeValue = (
  leg: Leg,
  symbol: Symbol,
  name: keyof Leg
): any => {
  const value: any = leg[name];
  if (value === undefined || value === null) {
    return { value: null, precision: 0, rounding: undefined };
  }
  // Otherwise, simply round it
  const rounding: number | undefined = symbol["strike-rounding"];
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
  symbol: Symbol,
  style?: string
): any => {
  const currencies: { [key: string]: string } = {
    premium: symbol.premiumCCY,
    hedge: symbol.riskCCY,
    gamma: symbol.riskCCY,
    vega: symbol.riskCCY,
  };
  if (name === "premium" || name === "hedge") {
    return {
      value: getStyledValue(leg[name], style),
      currency: currencies[name],
    };
  } else {
    return {
      value: leg[name],
      currency: currencies[name],
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
