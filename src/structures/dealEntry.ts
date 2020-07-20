import moment from "moment";

export enum DealType {
  Invalid = 0,
  Electronic = 2,
  Voice = 4,
  Manual = 8,
}

export enum EntryType {
  Empty,
  ExistingDeal,
  New,
  Clone,
}

export interface DealEntry {
  currencyPair: string;
  strategy: string;
  legs: number | null;
  spread?: number | null;
  vol?: number | null;
  strike?: string | number;
  notional: number | null;
  legAdj: boolean;
  buyer: string;
  seller: string;
  tradeDate: moment.Moment;
  expiryDate: moment.Moment | null;
  deliveryDate: moment.Moment;
  dealId: string;
  status: number;
  style: string;
  model: number | "";
  tenor: string;
  type: EntryType;
  dealType: DealType;
}

export const emptyDealEntry: DealEntry = {
  currencyPair: "",
  strategy: "",
  legs: null,
  notional: null,
  legAdj: false,
  buyer: "",
  seller: "",
  expiryDate: null,
  deliveryDate: moment(),
  tradeDate: moment(),
  dealId: "",
  status: 1,
  style: "European",
  model: 3,
  tenor: "",
  type: EntryType.Empty,
  dealType: DealType.Manual,
  vol: null,
  spread: null,
};
