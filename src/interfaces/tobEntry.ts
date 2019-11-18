import {EntryTypes} from 'interfaces/mdEntry';
import {ArrowDirection} from 'interfaces/w';

export interface TOBEntry {
  orderId?: string;
  tenor: string;
  strategy: string,
  symbol: string;
  price: string | null;
  quantity: string | null;
  user: string;
  firm?: string;
  type: EntryTypes;
  arrowDirection: ArrowDirection;
}
