import { toNumberOrFallbackIfNaN } from "columns/podColumns/OrderColumn/helpers/toNumberOrFallbackIfNaN";
import { Leg, Rates } from "components/MiddleOffice/types/leg";
import {
  LegOptionsDefIn,
  LegOptionsDefOut,
} from "components/MiddleOffice/types/legOptionsDef";
import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import moStore from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";
import { Sides } from "types/sides";
import { isStyledValue, StyledValue } from "types/styledValue";
import { Symbol } from "types/symbol";
import { InvalidTenor, Tenor } from "types/tenor";
import { getTenor } from "utils/dealUtils";
import { safeForceParseDate } from "utils/timeUtils";

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
  values: StyledValue | number,
  style: string | undefined
): number | null => {
  // This is just a workaround for some value
  // being saved as non-styled.
  //
  // We assume that the saved value, whatever it is, is
  // the value that corresponds to the selected style
  if (typeof values === "number") return values;
  if (style === undefined) {
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
  if (values === null) return null;
  if (index >= values.length) {
    console.warn(
      "cannot get the styled value because the index is larger than the number of items"
    );
    return null;
  }
  return values[index];
};

export const parseDates = (legs: ReadonlyArray<any>): ReadonlyArray<Leg> => {
  try {
    const mapper = (leg: any): Leg => {
      return {
        ...leg,
        ...safeForceParseDate<Leg>("premiumDate", leg.premiumDate),
        ...safeForceParseDate<Leg>("expiryDate", leg.expiryDate),
        ...safeForceParseDate<Leg>("deliveryDate", leg.deliveryDate),
      };
    };
    return legs.map(mapper);
  } catch (error) {
    console.warn(error);
    return legs;
  }
};

const getLegDefaultsFromDeal = (
  entry: DealEntry | null,
  index: number
): Partial<Leg> => {
  if (entry === null || entry === undefined) return {};
  const leg: Partial<Leg> = {};
  const tenor: Tenor | InvalidTenor = getTenor(entry, index);
  leg.premiumDate = entry.premiumDate;
  leg.deliveryDate = tenor.deliveryDate;
  leg.expiryDate = tenor.expiryDate;
  leg.notional = index === 1 && entry.not2 !== null ? entry.not1 : entry.not1;
  leg.vol = entry.vol;
  leg.strike = entry.dealstrike;
  leg.party = entry.buyer;
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
  entry: DealEntry
): ReadonlyArray<Leg> => {
  return definitions.map(
    (definition: LegOptionsDefIn, index: number): Leg => {
      const mapper = legDefMapper(entry.symbol);
      const base: Leg = mapper(definition);
      return {
        ...base,
        ...getLegDefaultsFromDeal(entry, index),
      };
    }
  );
};

export const mergeDefinitionsAndLegs = (
  entry: DealEntry,
  strategy: MOStrategy,
  symbol: Symbol,
  legs: ReadonlyArray<Leg>
): ReadonlyArray<Leg> => {
  const definitions = moStore.legDefinitions[strategy.productid];
  if (definitions === undefined) {
    return [];
  }
  const { in: list } = definitions;
  const mapper = legDefMapper(symbol);
  if (list.length === 1) {
    return list.map(mapper);
  } else {
    return list.map(
      (def: LegOptionsDefIn, index: number): Leg => {
        const defaultLeg: Leg = mapper(def);
        const existingLeg: Leg | undefined = legs[index];
        return {
          ...existingLeg,
          // These need be reset or not?
          option: defaultLeg.option,
          side: defaultLeg.side,
        };
      }
    );
  }
};

export const convertLegNumbers = (leg: Leg): Leg => {
  return {
    ...leg,
    fwdRate: toNumberOrFallbackIfNaN(leg.fwdRate, null),
    fwdPts: toNumberOrFallbackIfNaN(leg.fwdPts, null),
  };
};

const getReturnLegOut = (strategy: MOStrategy, index: number): string => {
  const defs = moStore.legDefinitions[strategy.productid];
  if (defs === undefined) {
    throw new Error(
      "We must have a legs definition for strategy: " + strategy.name
    );
  }
  const { out } = defs;
  const found: LegOptionsDefOut | undefined = out[index];
  if (found === undefined) {
    throw new Error(
      "We must have a legs definition for strategy: " + strategy.name
    );
  }
  const { ReturnLegOut } = found;
  return ReturnLegOut.toLowerCase();
};

export const calculateNetValue = (
  strategy: MOStrategy,
  legs: ReadonlyArray<Leg>,
  key: keyof Leg
): StyledValue => {
  return legs.reduce(
    (total: StyledValue, leg: Leg, index: number): StyledValue => {
      const returnLegOut = getReturnLegOut(strategy, index);
      if (returnLegOut !== "call" && returnLegOut !== "put") {
        return total;
      }
      const value: unknown = leg[key];
      if (!isStyledValue(value)) {
        throw new Error(`leg.${key} is not a styled value`);
      }
      return value.map((value: number | null, index: number): number | null => {
        const net: number | null = total[index];
        if (net === null) {
          return value;
        } else if (value !== null) {
          return value + net;
        } else {
          return null;
        }
      }) as StyledValue;
    },
    [null, null, null]
  );
};
