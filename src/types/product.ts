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

export interface Product {
  OptionProductType: string;
  description: string;
  name: string;
  pricerlegs: number;
  productid: string;
  shortname: string;
  source: ProductSource;
  spreadvsvol: "vol" | "spread" | "both";
  strike: string;
  fields: { f1: { [key: string]: EditableFlag } };

  [key: string]: any;
}

export const InvalidStrategy: Product = {
  productid: "",
  fields: { f1: {} },
} as Product;
export type StrategyMap = { [key: string]: Product };
