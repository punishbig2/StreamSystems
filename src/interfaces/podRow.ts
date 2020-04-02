import { Order } from 'interfaces/order';

export const InvalidPrice: number = -1;

export enum PodRowStatus {
  Normal,
  InvertedMarketsError,
  SizeTooSmall,
}

interface TOBRowBase {
  id: string;
  tenor: string;
  bid: Order;
  ofr: Order;
  mid: number | null;
  spread: number | null;
  status: PodRowStatus;
}

export type PodRow = TOBRowBase & {
  darkPool?: TOBRowBase;
  darkPrice: number | null;
};
