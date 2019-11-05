import {MessageTypes} from 'interfaces/md';

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
