import {TOBRow} from 'interfaces/tobRow';

export enum TileStatus {
  None,
  CreatingOrder,
}

export interface TileState {
  rows: { [tenor: string]: TOBRow },
  product: string;
  symbol: string;
  connected: boolean;
  oco: boolean;
  status: TileStatus,
}
