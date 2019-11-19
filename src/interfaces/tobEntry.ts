import {EntryTypes} from 'interfaces/mdEntry';
import {ArrowDirection} from 'interfaces/w';

export enum EntryStatus {
  None = 0,
  Active = 1 << 1,
  Cancelled = 1 << 2,
  PreFilled = 1 << 3,
  Edited = 1 << 4,
  Owned = 1 << 5,
  NotOwned = 1 << 6,
}

export interface TOBEntry {
  orderId?: string;
  tenor: string;
  strategy: string,
  symbol: string;
  price: number | null;
  quantity: number | null;
  user: string;
  firm?: string;
  type: EntryTypes;
  arrowDirection: ArrowDirection;
  status: EntryStatus;
}
