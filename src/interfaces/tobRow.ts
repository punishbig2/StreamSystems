import {Order} from 'interfaces/order';

export const InvalidPrice: number = -1;

export enum TOBRowStatus {
  Normal, BidGreaterThanOfrError, IncompleteError, CreatingOrder
}

export interface TOBRow {
  id: string;
  tenor: string;
  bid: Order;
  darkPool?: string;
  ofr: Order;
  mid: number | null;
  spread: number | null;
  status: TOBRowStatus,
}
