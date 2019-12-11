import {RunActions} from 'components/Run/enumerator';
import {TOBTable} from 'interfaces/tobTable';

export type EditHistory = { [key: string]: RunActions[] };
export interface State {
  history: EditHistory;
  orders: TOBTable;
  defaultOfrSize: number;
  defaultBidSize: number;
}
