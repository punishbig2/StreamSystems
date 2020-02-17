import {PodTable} from 'interfaces/podTable';

export interface RunState {
  orders: PodTable;
  initialized: boolean;
  defaultBidSize: number;
  defaultOfrSize: number;
  originalOrders: PodTable;
}
