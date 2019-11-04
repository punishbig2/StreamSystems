import {TOBRow} from 'interfaces/tobRow';

export interface TileState {
  rows: { [tenor: string]: TOBRow },
  product: string;
  symbol: string;
  connected: boolean;
  oco: boolean;
}
