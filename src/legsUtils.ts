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
    entry.notional !== null ? entry.notional * notionalRatio : null;
  const option: string =
    "ReturnLegOut" in definition
      ? definition.ReturnLegOut
      : definition.OptionLegType;
  // Now fill the stub legs
  const [ccy1, ccy2] = splitCurrencyPair(entry.currencyPair);
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
    entry.expiryDate === null
      ? addTenorToDate(entry.tradeDate, entry.tenor)
      : entry.expiryDate;
  return {
    premium: null,
    pricePercent: 0 /* FIXME: what would this be? */,
    vol: entry.vol,
    rates: rates,
    notional: notional,
    party: party,
    side: side,
    days: expiryDate.diff(entry.tradeDate, "d"),
    delta: null,
    vega: null,
    fwdPts: null,
    fwdRate: null,
    gamma: null,
    hedge: null,
    strike: entry.strike,
    premiumDate: moment(entry.tradeDate).add(symbol.SettlementWindow, "d"),
    premiumCurrency: symbol.premiumCCY,
    option: option,
    deliveryDate: entry.deliveryDate,
    expiryDate: expiryDate,
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
