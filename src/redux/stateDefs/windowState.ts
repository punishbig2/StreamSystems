import {TOBRow} from 'interfaces/tobRow';

export interface WindowState {
  rows: { [tenor: string]: TOBRow },
  strategy: string;
  symbol: string;
  connected: boolean;
  oco: boolean;
}

export const DefaultWindowState: WindowState = {
  connected: false,
  oco: false,
  symbol: '',
  strategy: '',
  rows: {},
};
