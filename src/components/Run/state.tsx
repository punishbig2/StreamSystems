import {Changes} from 'components/Run/enumerator';
import {TOBTable} from 'interfaces/tobTable';

export interface State {
  history: Changes[];
  table: TOBTable;
}
