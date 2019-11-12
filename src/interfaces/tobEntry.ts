import {EntryTypes} from 'interfaces/mdEntry';

export interface TOBEntry {
  orderId?: string;
  tenor: string;
  strategy: string,
  symbol: string;
  price: number | null;
  quantity: number | null;
  table?: TOBEntry[];
  user: string;
  firm?: string;
  type: EntryTypes;
}
