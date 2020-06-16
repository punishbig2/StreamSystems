export interface PricingResult {
  premiumAMT: number;
  pricePercent: number;
  delta: number;
  gamma: number;
  vega: number;
  hedge: number;
  legs: {
    premium: number;
    pricePercent: number;
    strike: number;
    vol: number;
    delta: number;
    gamma: number;
    vega: number;
    hedge: number;
  }[];
}
