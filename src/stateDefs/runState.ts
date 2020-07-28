import { PodTable } from "types/podTable";

export interface RunState {
  orders: PodTable;
  original: PodTable;
  defaultBidSize: number;
  defaultOfrSize: number;
  isLoading: boolean;
}
