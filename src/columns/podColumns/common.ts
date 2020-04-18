import { Order } from 'interfaces/order';
import { PodRow, PodRowStatus } from 'interfaces/podRow';
import { User } from 'interfaces/user';
import { PodRowStore } from 'mobx/stores/podRowStore';

export type PodRowProps = PodRow & {
  orders: Order[];
  defaultSize: number;
  minimumSize: number;
  darkPrice: number | null;
  currency: string;
  strategy: string;
  status: PodRowStatus;
  rowStore: PodRowStore;
  // Event handlers
  onTenorSelected: (tenor: string) => void;
};

