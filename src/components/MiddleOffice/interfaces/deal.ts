import moment from "moment";
import { Symbol } from "types/symbol";

export interface Deal {
  dealID: string;
  buyer: string;
  seller: string;
  cumulativeQuantity: number;
  currency: string;
  lastPrice: number | null;
  lastQuantity: number;
  leavesQuantity: number;
  strategy: string;
  currencyPair: string;
  symbol: Symbol;
  transactionTime: string;
  tenor: string;
  tenor2: string;
  strike: number | string;

  tradeDate: moment.Moment;
  spotDate: moment.Moment;
  deliveryDate: moment.Moment;
  expiryDate: moment.Moment;
  expiryDate2: moment.Moment;

  source: string;
  status: number;
}
