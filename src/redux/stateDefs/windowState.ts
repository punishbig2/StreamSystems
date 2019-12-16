import {TOBRow} from 'interfaces/tobRow';

export interface WindowState {
  rows: { [tenor: string]: TOBRow },
  strategy: string;
  symbol: string;
  oco: boolean;
}

export const DefaultWindowState: WindowState = {
  oco: false,
  symbol: '',
  strategy: '',
  rows: {},
};
