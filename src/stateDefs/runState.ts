import { PodTable } from 'types/podTable';

export interface RunState {
  readonly orders: PodTable;
  readonly original: PodTable;
  readonly defaultBidSize: number;
  readonly defaultOfrSize: number;
  readonly isLoading: boolean;
}
