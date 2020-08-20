import moment from "moment";
import { Symbol } from "types/symbol";

export interface Commission {
  rate: number | null;
  value: number | null;
}

export interface Deal {
  dealID: string;
  buyer: string;
  seller: string;
  currency: string;
  price: number | null;
  notional1: number;
  notional2?: number;
  strategy: string;
  currencyPair: string;
  symbol: Symbol;
  transactionTime: string;
  tenor1: string;
  tenor2: string;
  strike: number | string;

  tradeDate: moment.Moment;
  spotDate: moment.Moment;
  deliveryDate: moment.Moment;
  expiry1: moment.Moment;
  expiry2: moment.Moment;

  source: string;
  status: number;

  premiumStyle?: string;
  deltaStyle?: string;
  // Summary stuff
  fwdRate1?: number;
  fwdPts1?: number;
  fwdRate2?: number;
  fwdPts2?: number;

  commissions?: {
    buyer: Commission;
    seller: Commission;
  };
}
