import {TOBTable} from 'interfaces/tobTable';

export interface State {
  history: string[];
  table: TOBTable | null;
}
