export enum ProductSource {
  Voice = "Voice",
  Electronic = "Electronic",
  Manual = "Manual",
}

export interface MOStrategy {
  OptionProductType: string;
  description: string;
  name: string;
  pricerlegs: number;
  productid: string;
  shortname: string;
  source: ProductSource;
  spreadvsvol: "vol" | "spread";
  strike?: string;
}

export type StrategyMap = { [key: string]: MOStrategy };
