import {PodTable} from 'interfaces/podTable';

export interface RunState {
  orders: PodTable;
  defaultBidSize: number;
  defaultOfrSize: number;
  isLoading: boolean;
}
