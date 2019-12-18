import {OrderTypes} from 'interfaces/mdEntry';
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

export enum OrderErrors {
  NegativePrice = 'Invalid price. Price should be positive.',
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

export enum OrderStatus {
  None = 0,
  Active = 1 << 1,
  Cancelled = 1 << 2,
  PreFilled = 1 << 3,
  PriceEdited = 1 << 4,
  QuantityEdited = 1 << 5,
  Owned = 1 << 6,
  NotOwned = 1 << 7,
  HaveOrders = 1 << 8,
  HasDepth = 1 << 9,
  SameBank = 1 << 10,
  BeingCreated = 1 << 11,
  BeingCancelled = 1 << 12,
  BeingLoaded = 1 << 13,
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
  type: OrderTypes;
  arrowDirection: ArrowDirection;
  status: OrderStatus;
}
