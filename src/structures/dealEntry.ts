import moment from "moment";

export enum DealStatus {
  Pending = "Pending",
  Priced = "Priced",
  SEFPreliminary = "SEF Preliminary",
  SEFFinal = "SEF Final",
}

export enum DealType {
  Invalid = 0,
  Electronic = 2,
  Voice = 4,
  Multileg = 8,
}

export interface DealEntry {
  currencyPair: string;
  strategy: string;
  legs: number | null;
  strike?: string;
  spread?: number | null;
  vol?: number | null;
  notional: number | null;
  legAdj: boolean;
  buyer: string;
  seller: string;
  tradeDate: moment.Moment;
  expiryDate: moment.Moment;
  deliveryDate: moment.Moment;
  dealId: string;
  status: DealStatus;
  style: string;
  model: number | "";
  tenor: string;
  type: DealType;
}

export const emptyDealEntry: DealEntry = {
  currencyPair: "",
  strategy: "",
  legs: null,
  notional: null,
  legAdj: true,
  buyer: "",
  seller: "",
  expiryDate: moment(),
  deliveryDate: moment(),
  tradeDate: moment(),
  dealId: "",
  status: DealStatus.Pending,
  style: "",
  model: "",
  tenor: "",
  type: DealType.Invalid,
};
