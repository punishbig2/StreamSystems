import { Deal } from "components/MiddleOffice/types/deal";
import { Leg, Rates } from "components/MiddleOffice/types/leg";
import { LegOptionsDefIn } from "components/MiddleOffice/types/legOptionsDef";
import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import moStore from "mobx/stores/moStore";
import moment from "moment";
import { DealEntry } from "structures/dealEntry";
import { Sides } from "types/sides";
import { Symbol } from "types/symbol";

export const StylesMap: { [key: string]: 0 | 1 | 2 } = {
  Forward: 0,
  Spot: 1,
  Sticky: 2,
};

const sideToSide = (side: string): Sides => {
  if (side === "buy") return Sides.Buy;
  if (side === "sell") return Sides.Sell;
  return Sides.None;
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

const getLegDefaultsFromDeal = (
  deal: Deal | null,
  index: number
): Partial<Leg> => {
  if (deal === null || deal === undefined) return {};
  const { symbol } = deal;
  const leg: Partial<Leg> = {};
  if (deal.expiry1) leg.expiryDate = deal.expiry1;
  if (deal.tradeDate)
    leg.premiumDate = moment(deal.tradeDate).add(symbol.SettlementWindow, "d");
  if (deal.deliveryDate) leg.deliveryDate = deal.deliveryDate;
  leg.notional =
    index === 1 && deal.notional2 !== null ? deal.notional2 : deal.notional1;
  leg.vol = deal.vol;
  leg.strike = deal.strike;
  leg.party = deal.buyer;
  return leg;
};

const legDefMapper = (symbol: Symbol) => (definition: LegOptionsDefIn): Leg => {
  const rates: Rates = [
    {
      currency: symbol.premiumCCY,
      value: 0,
    },
    {
      currency: symbol.riskCCY,
      value: 0,
    },
  ];
  return {
    premium: [null, null, null],
    price: [null, null, null],
    vol: null,
    rates: rates,
    notional: null,
    party: "",
    side: sideToSide(definition.SideType),
    days: null,
    delta: [null, null, null],
    fwdPts: null,
    fwdRate: null,
    hedge: [null, null, null],
    strike: null,
    premiumDate: null,
    premiumCurrency: symbol.premiumCCY,
    option: definition.OptionLegType,
    deliveryDate: null,
    expiryDate: null,
    usi_num: null,
  };
};

export const createLegsFromDefinitionAndDeal = (
  definitions: LegOptionsDefIn[],
  deal: Deal
): ReadonlyArray<Leg> => {
  return definitions.map(
    (definition: LegOptionsDefIn, index: number): Leg => {
      const mapper = legDefMapper(deal.symbol);
      const base: Leg = mapper(definition);
      return {
        ...base,
        ...getLegDefaultsFromDeal(deal, index),
      };
    }
  );
};

export const createLegsFromDefinitionAndSymbol = (
  definitions: LegOptionsDefIn[],
  symbol: Symbol
): ReadonlyArray<Leg> => {
  return definitions.map(legDefMapper(symbol));
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
  const mapper = legDefMapper(symbol);
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
