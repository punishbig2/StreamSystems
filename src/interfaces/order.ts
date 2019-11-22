import {EntryTypes} from 'interfaces/mdEntry';
import {ArrowDirection, MessageTypes} from 'interfaces/w';

export enum Sides {
  Buy = 'BUY', Sell = 'SELL'
}

export interface CreateOrder {
  MsgType: MessageTypes,
  TransactTime: string,
  User: string,
  Symbol: string,
  Strategy: string,
  Tenor: string,
  Side: Sides,
  Quantity: string,
  Price: string,
}

export interface UpdateOrder {
  MsgType: MessageTypes;
  TransactTime: string;
  User: string;
  OrderID: string;
  Quantity: string;
  Price: string;
  Symbol: string,
  Strategy: string,
  Tenor: string,
}

export enum EntryStatus {
  None = 0,
  Active = 1 << 1 /* 2 */,
  Cancelled = 1 << 2 /* 4 */,
  PreFilled = 1 << 3 /* 8 */,
  PriceEdited = 1 << 4 /* 16 */,
  QuantityEdited = 1 << 5 /* 32 */,
  Owned = 1 << 6 /* 64 */,
  NotOwned = 1 << 7 /* 128 */,
  HaveOtherOrders = 1 << 8 /* 256 */,
}

export interface Order {
  orderId?: string;
  tenor: string;
  strategy: string,
  symbol: string;
  price: number | null;
  quantity: number | null;
  user: string;
  firm?: string;
  type: EntryTypes;
  arrowDirection: ArrowDirection;
  status: EntryStatus;
}
