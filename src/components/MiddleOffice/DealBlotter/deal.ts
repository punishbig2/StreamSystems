import moment from "moment";
import { Symbol } from "interfaces/symbol";

export interface Deal {
  dealID: string;
  buyer: string;
  seller: string;
  cumulativeQuantity: number;
  currency: string;
  lastPrice: number;
  lastQuantity: number;
  leavesQuantity: number;
  strategy: string;
  currencyPair: string;
  symbol: Symbol;
  transactionTime: string;
  tenor: string;

  tradeDate: moment.Moment;
  spotDate: moment.Moment;
  deliveryDate: moment.Moment;
  expiryDate: moment.Moment;
}
