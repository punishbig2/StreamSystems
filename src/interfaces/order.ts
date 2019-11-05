import {MessageTypes} from 'interfaces/md';

export enum Sides {
  Buy = '0', Sell = '1',
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
