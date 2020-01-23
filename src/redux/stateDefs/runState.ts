import { TOBTable } from "interfaces/tobTable";

export interface RunState {
  orders: TOBTable;
  defaultOfrSize: number;
  defaultBidSize: number;
  initialized: boolean;
}
