import { Order } from "types/order";

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
  darkPrice: number | null;
};
