import {TOBEntry} from 'interfaces/tobEntry';

export interface TOBRow {
  id: string;
  tenor: string;
  bid: TOBEntry;
  darkPool?: string;
  ofr: TOBEntry;
  mid: number | null;
  spread: number | null;
}
