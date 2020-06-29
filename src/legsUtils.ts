import { Deal } from "components/MiddleOffice/interfaces/deal";
import {
  LegOptionsDefOut,
  LegOptionsDefIn,
} from "components/MiddleOffice/interfaces/legOptionsDef";
import { Leg, Rates } from "components/MiddleOffice/interfaces/leg";
import { Sides } from "interfaces/sides";
import moment from "moment";
import { splitCurrencyPair } from "symbolUtils";
import { Symbol } from "interfaces/symbol";

export const createLegsFromDefinition = (
  deal: Deal,
  definitions: LegOptionsDefOut[] | LegOptionsDefIn[]
): Leg[] => {
  const legs: Leg[] = [];
  // Now fill the stub legs
  const [ccy1, ccy2] = splitCurrencyPair(deal.currencyPair);
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
  const expiryDate: moment.Moment = deal.expiryDate;
  for (const definition of definitions) {
    const sideType: string =
      "ReturnSide" in definition ? definition.ReturnSide : definition.SideType;
    const side: Sides = sideType === "buy" ? Sides.Buy : Sides.Sell;
    const notionalRatio: number =
      "notional_ratio" in definition ? definition.notional_ratio : 0;
    const notional: number | null =
      deal.lastQuantity === null
        ? null
        : 1e6 * deal.lastQuantity * notionalRatio;
    const { symbol } = deal;
    const leg: Leg = {
      premium: null,
      price: deal.lastPrice,
      vol: deal.lastPrice,
      rates: rates,
      notional: notional,
      party: deal.buyer,
      side: side,
      days: expiryDate.diff(deal.tradeDate, "d"),
      delta: null,
      vega: null,
      fwdPts: null,
      fwdRate: null,
      gamma: null,
      hedge: null,
      strike: null,
      premiumDate: deal.spotDate,
      premiumCurrency: symbol.premiumCCY,
      option:
        "ReturnLegOut" in definition
          ? definition.ReturnLegOut
          : definition.OptionLegType,
      deliveryDate: deal.deliveryDate,
      expiryDate: deal.expiryDate,
      pricePercent: null,
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
