import { Order } from "types/order";

export enum PodRowStatus {
  Normal,
  InvertedMarketsError,
  SizeTooSmall,
}

interface TOBRowBase {
  readonly id: string;
  readonly tenor: string;
  bid: Order;
  ofr: Order;
  mid: number | null;
  spread: number | null;
  readonly status: PodRowStatus;
}

export type PodRow = TOBRowBase & {
  readonly darkPrice: number | null;
};
