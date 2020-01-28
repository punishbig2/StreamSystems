import {TOBTable} from 'interfaces/tobTable';

export interface RunState {
  orders: TOBTable;
  initialized: boolean;
  defaultBidSize: number;
  defaultOfrSize: number;
  originalOrders: TOBTable;
}
