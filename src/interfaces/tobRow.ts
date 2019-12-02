import {Order} from 'interfaces/order';

export enum TOBRowStatus {
  Normal, BidGreaterThanOfrError, IncompleteError
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
