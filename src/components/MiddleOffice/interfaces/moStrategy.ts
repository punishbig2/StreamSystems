export enum ProductSource {
  Voice = "Voice",
  Electronic = "Electronic",
  Manual = "Manual",
}

export enum EditableCondition {
  Priced = "Priced",
  NotEditable = "Not Editable",
  Pending = "Pending",
  NotApplicable = "N/A",
  None = "",
}

export interface MOStrategy {
  OptionProductType: string;
  description: string;
  name: string;
  pricerlegs: number;
  productid: string;
  shortname: string;
  source: ProductSource;
  spreadvsvol: "vol" | "spread" | "both";
  strike?: string;
  fields: { f1: { [key: string]: EditableCondition } };
}

export type StrategyMap = { [key: string]: MOStrategy };
