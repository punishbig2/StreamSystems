import { Rates } from "components/MiddleOffice/interfaces/leg";

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
  summary: ResultLeg;
  legs: ResultLeg[];
}
