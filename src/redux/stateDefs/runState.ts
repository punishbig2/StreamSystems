import {TOBTable} from 'interfaces/tobTable';
import {RunActions} from 'redux/reducers/runReducer';

export type EditHistory = { [key: string]: RunActions[] };
export interface RunState {
  history: EditHistory;
  orders: TOBTable;
  defaultOfrSize: number;
  defaultBidSize: number;
  initialized: boolean;
}
