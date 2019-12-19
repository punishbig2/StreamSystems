import {Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';

export interface WindowState {
  rows: { [tenor: string]: TOBRow },
  strategy: string;
  symbol: string;
  oco: boolean;
  orders: Order[];
}

export const DefaultWindowState: WindowState = {
  oco: false,
  symbol: '',
  strategy: '',
  rows: {},
  orders: [],
};
