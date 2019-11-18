import {TOBEntry} from 'interfaces/tobEntry';

export interface TOBRow {
  id: string;
  tenor: string;
  bid: TOBEntry;
  darkPool?: string;
  offer: TOBEntry;
  mid: number | null;
  spread: number | null;
  modified?: boolean;
}
