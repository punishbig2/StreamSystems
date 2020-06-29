import { Rates, Leg } from "components/MiddleOffice/interfaces/leg";
import { splitCurrencyPair } from "symbolUtils";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import moStore from "mobx/stores/moStore";
import { LegOptionsDefOut } from "components/MiddleOffice/interfaces/legOptionsDef";

export interface PricingResult {
  summary: Partial<SummaryLeg>;
  legs: Leg[];
}

export const buildPricingResult = (data: any, deal: Deal): PricingResult => {
  const { symbol, expiryDate } = deal;
  const {
    Output: {
      Results: { Premium, Gamma, Vega, Forward_Delta, Legs },
      MarketSnap,
      Inputs: { forward, spot, LegInputs },
    },
  } = data;
  const currencies: [string, string] = splitCurrencyPair(deal.currencyPair);
  const rates: Rates = [
    {
      currency: currencies[0],
      value: 100 * MarketSnap.ccy1Zero,
    },
    {
      currency: currencies[1],
      value: 100 * MarketSnap.ccy2Zero,
    },
  ];
  const definitions: LegOptionsDefOut[] = moStore.getOutLegsDefinitions(
    deal.strategy
  );
  const notionalRatio: number = definitions[0].notional_ratio;
  const legs: Leg[] = Legs.map(
    (name: string, index: number): Leg => {
      const option: string = name.split("|")[1];
      return {
        option: option,
        pricePercent: 100 * Premium["%_CCY1"][index],
        strike: LegInputs.Strike[index],
        vol: 100 * LegInputs.Vol[index],
        delta: Forward_Delta["%_CCY1"][index],
        premium: Premium["CCY1"][index] * notionalRatio,
        gamma: Gamma["CCY1"][index] * notionalRatio,
        vega: Vega["CCY1"][index] * notionalRatio,
        hedge: Forward_Delta.CCY1[index] * notionalRatio,
        fwdPts: 1000 * (forward - spot),
        fwdRate: forward,
        premiumCurrency: symbol.premiumCCY,
        rates: rates,
        // Inserted members
        deliveryDate: deal.deliveryDate,
        days: expiryDate.diff(deal.tradeDate, "d"),
        expiryDate: expiryDate,
        notional: LegInputs.Not[index] * notionalRatio,
        party: deal.buyer,
        premiumDate: deal.spotDate,
        side: LegInputs.Side[index],
      };
    }
  );

  return {
    summary: { dealOutput: legs[0], spot },
    legs: legs.slice(1),
  };
};
