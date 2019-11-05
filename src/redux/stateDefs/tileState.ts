import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';

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
  dobs: {[tenor: string]: TOBTable}
  status: TileStatus,
}
