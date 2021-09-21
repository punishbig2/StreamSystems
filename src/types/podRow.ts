import { Order } from "types/order";

export enum PodRowStatus {
  Normal,
  InvertedMarketsError,
  SizeTooSmall,
}

interface TOBRowBase {
  readonly id: string;
  readonly tenor: string;
  readonly bid: Order;
  readonly ofr: Order;
  readonly mid: number | null;
  readonly spread: number | null;
  readonly status: PodRowStatus;
}

export type PodRow = TOBRowBase & {
  readonly darkPrice: number | null;
};
