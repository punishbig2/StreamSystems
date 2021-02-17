import { Order } from "types/order";
import { PodRow, PodRowStatus } from "types/podRow";
import { PodRowStore } from "mobx/stores/podRowStore";
import { W } from "types/w";

export type PodRowProps = PodRow & {
  orders: Order[];
  defaultSize: number;
  minimumSize: number;
  darkPrice: number | null;
  symbol: string;
  strategy: string;
  status: PodRowStatus;
  rowStore: PodRowStore;
  darkpool: W;
  // Event handlers
  onTenorSelected: (tenor: string) => void;
};
