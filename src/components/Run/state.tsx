import {RunActions} from 'components/Run/enumerator';
import {TOBTable} from 'interfaces/tobTable';

export interface State {
  history: RunActions[];
  table: TOBTable;
}
