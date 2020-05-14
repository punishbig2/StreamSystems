import { Order } from "interfaces/order";
import { PodRow, PodRowStatus } from "interfaces/podRow";
import { PodRowStore } from "mobx/stores/podRowStore";
import { W } from "interfaces/w";

export type PodRowProps = PodRow & {
  orders: Order[];
  defaultSize: number;
  minimumSize: number;
  darkPrice: number | null;
  currency: string;
  strategy: string;
  status: PodRowStatus;
  rowStore: PodRowStore;
  darkpool: W;
  // Event handlers
  onTenorSelected: (tenor: string) => void;
};
