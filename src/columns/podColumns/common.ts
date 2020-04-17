import { Order } from 'interfaces/order';
import { PodRow, PodRowStatus } from 'interfaces/podRow';
import { User } from 'interfaces/user';
import { PodRowStore } from 'mobx/stores/podRowStore';

export type PodRowProps = PodRow & {
  orders: Order[];
  personality: string;
  defaultSize: number;
  minimumSize: number;
  darkPrice: number | null;
  currency: string;
  strategy: string;
  status: PodRowStatus;
  connected: boolean;
  user: User;
  rowStore: PodRowStore;
  // Event handlers
  onTenorSelected: (tenor: string) => void;
};

