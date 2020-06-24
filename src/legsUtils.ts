import { Deal } from "components/MiddleOffice/DealBlotter/deal";
import {
  LegOptionsDefOut,
  LegOptionsDefIn,
} from "components/MiddleOffice/interfaces/legOptionsDef";
import { Leg, Depo } from "components/MiddleOffice/interfaces/leg";
import { Sides } from "interfaces/sides";
import moment from "moment";

interface Inputs {
  strike: number | null;
  spot: number | null;
  forward: number | null;
}

export const createLegsFromDefinition = (
  deal: Deal,
  definitions: LegOptionsDefOut[] | LegOptionsDefIn[],
  inputs: Inputs
): Leg[] => {
  console.log(definitions);
  const legs: Leg[] = [];
  const { symbol } = deal;
  // Now fill the stub legs
  const depo: Depo = [
    {
      currency: symbol.notionalCCY,
      value: 0,
    },
    {
      currency: symbol.riskCCY,
      value: 0,
    },
  ];
  for (const definition of definitions) {
    const sideType: string =
      "ReturnSide" in definition ? definition.ReturnSide : definition.SideType;
    const side: Sides = sideType === "buy" ? Sides.Buy : Sides.Sell;
    const expiryDate: moment.Moment = deal.expiryDate;
    const notionalRatio: number =
      "notional_ratio" in definition ? definition.notional_ratio : 0;
    const notional: number | null =
      deal.lastQuantity === null ? null : deal.lastQuantity * notionalRatio;
    const leg: Leg = {
      premium: null,
      premiumDate: null,
      price: deal.lastPrice,
      vol: deal.lastPrice,
      depo: depo,
      notional: notional,
      party: deal.buyer,
      side: side,
      days: expiryDate.diff(deal.tradeDate, "d"),
      delta: null,
      vega: null,
      fwdPts:
        inputs.forward !== null && inputs.spot !== null
          ? 1000 * (inputs.forward - inputs.spot)
          : null,
      fwdRate: inputs.forward,
      gamma: null,
      hedge: null,
      strike: inputs.strike,
      option:
        "ReturnLegOut" in definition
          ? definition.ReturnLegOut
          : definition.OptionLegType,
      deliveryDate: deal.deliveryDate,
      expiryDate: deal.expiryDate,
    };
    legs.push(leg);
  }
  return legs;
};
