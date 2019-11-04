import {EntryTypes} from 'interfaces/mdEntry';

export interface TOBEntry {
  tenor: string;
  product: string,
  symbol: string;
  price: number | null;
  size: number | null;
  quantity?: number;
  table?: TOBEntry[];
  user: string;
  firm: string;
  type: EntryTypes;
}
