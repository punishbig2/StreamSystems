import { Leg, Rates } from "components/MiddleOffice/interfaces/leg";
import {
  LegOptionsDefIn,
  LegOptionsDefOut,
} from "components/MiddleOffice/interfaces/legOptionsDef";
import { Sides } from "interfaces/sides";
import { Symbol } from "interfaces/symbol";
import moment from "moment";
import { DealEntry } from "structures/dealEntry";
import { splitCurrencyPair } from "symbolUtils";

export const parseManualLegs = (data: any[]): Leg[] => {
  const mapper = (item: any): Leg => ({
    ...item,
    premiumDate: moment(item.premiumDate),
    expiryDate: moment(item.expiryDate),
    deliveryDate: moment(item.deliveryDate),
  });
  return data.map(mapper);
};

export const createLegsFromDefinition = (
  entry: DealEntry,
  definitions: LegOptionsDefOut[] | LegOptionsDefIn[],
  symbol: Symbol
): Leg[] => {
  console.log(definitions);
  const legs: Leg[] = [];
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
  const expiryDate: moment.Moment = entry.expiryDate;
  for (const definition of definitions) {
    const sideType: string =
      "ReturnSide" in definition ? definition.ReturnSide : definition.SideType;
    const side: Sides = sideType === "buy" ? Sides.Buy : Sides.Sell;
    const notionalRatio: number =
      "notional_ratio" in definition ? definition.notional_ratio : 0;
    const notional: number | null =
      entry.notional !== null ? entry.notional * notionalRatio : null;
    const option: string =
      "ReturnLegOut" in definition
        ? definition.ReturnLegOut
        : definition.OptionLegType;
    console.log(option);
    const leg: Leg = {
      premium: null,
      pricePercent: 0 /* FIXME: what would this be? */,
      vol: entry.vol,
      rates: rates,
      notional: notional,
      party: entry.buyer,
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
      expiryDate: entry.expiryDate,
    };
    legs.push(leg);
  }
  return legs;
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
