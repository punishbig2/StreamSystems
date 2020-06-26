import { Rates } from "components/MiddleOffice/interfaces/leg";
import { splitCurrencyPair } from "symbolUtils";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";

export interface ResultLeg {
  option: string;
  premium: number | null;
  pricePercent: number | null;
  strike: number | null;
  vol: number | null;
  delta: number | null;
  gamma: number | null;
  vega: number | null;
  hedge: number | null;
  fwdPts: number | null;
  fwdRate: number | null;
  premiumCurrency: string;
  rates: Rates;
}

export interface PricingResult {
  summary: Partial<SummaryLeg>;
  legs: ResultLeg[];
}

export const buildPricingResult = (data: any, deal: Deal): PricingResult => {
  const { symbol } = deal;
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
  const legs = Legs.map(
    (name: string, index: number): ResultLeg => {
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
      };
    }
  );

  return {
    summary: { dealOutput: legs[0], spot },
    legs: legs.slice(1),
  };
};
