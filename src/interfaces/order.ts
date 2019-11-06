import {MessageTypes} from 'interfaces/md';
import {EntryTypes} from 'interfaces/mdEntry';

export enum Sides {
  Buy = 'BUY', Sell = 'SELL',
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

export interface Order {
  OrderID: string;
  type: EntryTypes;
  quantity: number;
  price: number;
}
