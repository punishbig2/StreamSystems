import {EntryTypes} from 'interfaces/mdEntry';

export interface TOBEntry {
  tenor: string;
  strategy: string,
  symbol: string;
  price: number | null;
  quantity: number;
  table?: TOBEntry[];
  user: string;
  firm: string;
  type: EntryTypes;
}
