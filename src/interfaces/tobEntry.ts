import {EntryTypes} from 'interfaces/mdEntry';
import {ArrowDirection} from 'interfaces/w';

export enum EntryStatus {
  None = 0,
  Active = 1 << 1,
  Cancelled = 1 << 2,
  PreFilled = 1 << 3,
  QuantityEdited = 1 << 5,
  PriceEdited = 1 << 4,
  Owned = 1 << 6,
  NotOwned = 1 << 7,
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
  // PriceEdited values
  __quantity: number | null;
  __price: number | null;
}
