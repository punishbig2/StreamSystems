import { Order } from "types/order";
import { PodRow, PodRowStatus } from "types/podRow";
import { PodRowStore } from "mobx/stores/podRowStore";
import { W } from "types/w";

export type PodRowProps = PodRow & {
  readonly orders: ReadonlyArray<Order>;
  readonly defaultSize: number;
  readonly minimumSize: number;
  readonly darkPrice: number | null;
  readonly currency: string;
  readonly strategy: string;
  readonly status: PodRowStatus;
  readonly rowStore: PodRowStore;
  readonly darkpool: W;
  readonly rowNumber: number;
  // Event handlers
  onTenorSelected(tenor: string): void;
};
