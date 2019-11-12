import {TOBEntry} from 'interfaces/tobEntry';
import {TOBTable} from 'interfaces/tobTable';

export interface TOBRow {
  id: string;
  tenor: string;
  bid: TOBEntry;
  darkPool?: string;
  offer: TOBEntry;
  mid: number | null;
  spread: number | null;
  dob?: TOBTable;
  modified?: boolean;
}
