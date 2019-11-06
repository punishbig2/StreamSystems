import {MessageTypes} from 'interfaces/md';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';

export enum Sides {
  Buy = 'BUY', Sell = 'SELL',
}

export interface CreateOrder {
  MsgType: MessageTypes,
  TransactTime: number,
  User: string,
  Symbol: string,
  Strategy: string,
  Tenor: string,
  Side: Sides,
  Quantity: number,
  Price: number,
}

export interface Order {
  OrderID: string;
  type: EntryTypes;
  quantity: number;
  price: number;
}
