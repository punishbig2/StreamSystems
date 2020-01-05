import {TOBRow} from 'interfaces/tobRow';

export interface WindowState {
  rows: { [tenor: string]: TOBRow },
  strategy: string;
  symbol: string;
}

export const DefaultWindowState: WindowState = {
  symbol: '',
  strategy: '',
  rows: {},
};
