import {TOBEntry} from 'interfaces/tobEntry';
import {TOBTable} from 'interfaces/tobTable';

export interface TOBRow {
  tenor: string;
  bid: TOBEntry;
  darkPool?: string;
  ask: TOBEntry;
  dob?: TOBTable;
}
