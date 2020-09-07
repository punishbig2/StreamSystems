import { Leg, Rates } from "components/MiddleOffice/interfaces/leg";
import {
  LegOptionsDefIn,
  LegOptionsDefOut,
} from "components/MiddleOffice/interfaces/legOptionsDef";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { Sides } from "types/sides";
import { Symbol } from "types/symbol";
import moStore from "mobx/stores/moStore";
import moment from "moment";
import { DealEntry } from "structures/dealEntry";
import { splitCurrencyPair } from "utils/symbolUtils";
import { addTenorToDate } from "utils/tenorUtils";

const StylesMap: { [key: string]: 0 | 1 | 2 } = {
  Forward: 0,
  Spot: 1,
  Sticky: 2,
};

export const getStyledValue = (
  values: [number | null, number | null, number | null],
  style: string | undefined
): number | null => {
  if (style === undefined) {
    console.warn("cannot get the styled value because the style is undefined");
    return null;
  }
  const index: number | undefined = StylesMap[style];
  if (index === undefined) {
    console.warn(
      "cannot get the styled value because the index is undefined for style `" +
        style +
        "'"
    );
    return null;
  }
  if (index >= values.length) {
    console.warn(
      "cannot get the styled value because the index is larger than the number of items"
    );
    return null;
  }
  return values[index];
};

export const fixDates = (data: any[]): Leg[] => {
  const mapper = (item: any): Leg => {
    return {
      ...item,
      premiumDate: moment(item.premiumDate),
      expiryDate: moment(item.expiryDate),
      deliveryDate: moment(item.deliveryDate),
    };
  };
  return data.map(mapper);
};

const legDefMapper = (entry: DealEntry, symbol: Symbol) => (
  definition: LegOptionsDefIn | LegOptionsDefOut
): Leg => {
  const sideType: string =
    "ReturnSide" in definition ? definition.ReturnSide : definition.SideType;
  const side: Sides = sideType === "buy" ? Sides.Buy : Sides.Sell;
  const party: string = side === Sides.Buy ? entry.buyer : entry.seller;
  const notionalRatio: number =
    "notional_ratio" in definition ? definition.notional_ratio : 0;
  const notional: number | null =
    entry.not1 !== null ? entry.not1 * notionalRatio : null;
  const option: string =
    "ReturnLegOut" in definition
      ? definition.ReturnLegOut
      : definition.OptionLegType;
  // Now fill the stub legs
  const [ccy1, ccy2] = splitCurrencyPair(entry.ccypair);
  const rates: Rates = [
    {
      currency: ccy1,
      value: 0,
    },
    {
      currency: ccy2,
      value: 0,
    },
  ];
  const expiryDate: moment.Moment =
    entry.tenor1expiry === null
      ? addTenorToDate(entry.tradeDate, entry.tenor1)
      : entry.tenor1expiry;
  return {
    premium: [null, null, null],
    price: [null, null, null],
    vol: entry.vol !== null && entry.vol !== undefined ? 100 * entry.vol : null,
    rates: rates,
    notional: notional,
    party: party,
    side: side,
    days: expiryDate.diff(entry.tradeDate, "d"),
    delta: [null, null, null],
    fwdPts: null,
    fwdRate: null,
    hedge: [null, null, null],
    strike: entry.dealstrike,
    premiumDate: moment(entry.tradeDate).add(symbol.SettlementWindow, "d"),
    premiumCurrency: symbol.premiumCCY,
    option: option,
    deliveryDate: entry.deliveryDate,
    expiryDate: expiryDate,
    usi_num: null,
  };
};

export const createLegsFromDefinition = (
  entry: DealEntry,
  definitions: (LegOptionsDefOut | LegOptionsDefIn)[],
  symbol: Symbol
): Leg[] => {
  return definitions.map(legDefMapper(entry, symbol));
};

export const getVegaAdjust = (type: string, symbol: Symbol): boolean => {
  if (type === "Butterfly") {
    return symbol.vegaAdjustBF;
  } else if (type === "RiskReversal") {
    return symbol.vegaAdjustRR;
  } else {
    return false;
  }
};

export const mergeDefinitionsAndLegs = (
  entry: DealEntry,
  strategy: MOStrategy,
  symbol: Symbol,
  legs: Leg[]
): Leg[] => {
  const definitions = moStore.legDefinitions[strategy.productid];
  if (definitions === undefined) {
    return [];
  }
  const { in: list } = definitions;
  const mapper = legDefMapper(entry, symbol);
  return list.map(
    (def: LegOptionsDefIn): Leg => {
      const stub: Leg = mapper(def);
      const existingLeg: Leg | undefined = legs.find((leg: Leg) => {
        return leg.option === stub.option && leg.side === stub.side;
      });
      if (existingLeg !== undefined) return existingLeg;
      return stub;
    }
  );
};
