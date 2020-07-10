import moment from "moment";
import { Symbol } from "interfaces/symbol";
import { DealStatus } from "structures/dealEntry";

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
  strike: number | string;

  tradeDate: moment.Moment;
  spotDate: moment.Moment;
  deliveryDate: moment.Moment;
  expiryDate: moment.Moment;

  source: string;
  status: DealStatus;
}
