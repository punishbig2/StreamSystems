import {Order} from 'interfaces/order';

export const InvalidPrice: number = -1;

export enum TOBRowStatus {
  Normal,
  InvertedMarketsError,
  IncompleteError,
  CreatingOrder,
  NegativePrice,
  Executed
}

interface TOBRowBase {
  id: string;
  tenor: string;
  bid: Order;
  ofr: Order;
  mid: number | null;
  spread: number | null;
  status: TOBRowStatus;
}

export type PodRow = TOBRowBase & {
  darkPool?: TOBRowBase;
  darkPrice: number | null;
};
