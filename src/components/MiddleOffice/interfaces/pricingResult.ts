import { Rates, Leg } from "components/MiddleOffice/interfaces/leg";
import { splitCurrencyPair } from "symbolUtils";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { Sides } from "interfaces/sides";

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
      Inputs: { strike, putVol, callVol, forward, spot },
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
  const legs: Leg[] = Legs.map(
    (name: string, index: number): Leg => {
      const option: string = name.split("|")[1];
      return {
        option: option,
        premium: Premium["CCY1"][index],
        pricePercent: Premium["%_CCY1"][index],
        strike: strike,
        vol: option.toLowerCase() === "put" ? putVol : callVol,
        delta: Forward_Delta["%_CCY1"][index],
        gamma: Gamma["CCY1"][index],
        vega: Vega["CCY1"][index],
        hedge: Forward_Delta.CCY1[index],
        fwdPts: 1000 * (forward - spot),
        fwdRate: forward,
        premiumCurrency: symbol.premiumCCY,
        rates: rates,
        // Inserted members
        deliveryDate: deal.deliveryDate,
        days: expiryDate.diff(deal.tradeDate, "d"),
        expiryDate: expiryDate,
        notional: 1E6 * deal.lastQuantity,
        party: deal.buyer,
        premiumDate: deal.spotDate,
        price: deal.lastPrice,
        side: option.includes("Call") ? Sides.Buy : Sides.Sell,
      };
    }
  );

  return {
    summary: { dealOutput: legs[0], spot },
    legs: legs.slice(1),
  };
};
