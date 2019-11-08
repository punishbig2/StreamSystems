import {Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';

export enum TileStatus {
  None,
  CreatingOrder,
  OrderCreated,
  OrderNotCreated,
  CancelingOrder,
  OrderCanceled,
  OrderNotCanceled,
}

export interface WindowState {
  rows: { [tenor: string]: TOBRow },
  orders: { [tenor: string]: Order },
  strategy: string;
  symbol: string;
  connected: boolean;
  oco: boolean;
  status: TileStatus,
}

export const DefaultWindowState: WindowState = {
  connected: false,
  oco: false,
  symbol: '',
  strategy: '',
  rows: {},
  status: TileStatus.None,
  orders: {},
};
