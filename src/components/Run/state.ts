import {RunActions} from 'components/Run/enumerator';
import {TOBTable} from 'interfaces/tobTable';

export interface State {
  history: {[id: string]: RunActions[]};
  orders: TOBTable;
  defaultOfrQty: number;
  defaultBidQty: number;
}
