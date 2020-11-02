export enum ProductSource {
  Voice = "Voice",
  Electronic = "Electronic",
  Manual = "Manual",
}

export enum EditableFlag {
  Priced = "Priced",
  NotEditable = "Not Editable",
  Pending = "Pending",
  NotApplicable = "N/A",
  Editable = "Editable",
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
  fields: { f1: { [key: string]: EditableFlag } };
}

export const InvalidStrategy: MOStrategy = {
  productid: "",
  fields: { f1: {} },
} as MOStrategy;
export type StrategyMap = { [key: string]: MOStrategy };
