import moment from 'moment';

export enum DealStatus {
  Pending = 'Pending',
}

export interface DealEntry {
  currency: string;
  strategy: string;
  legs: number;
  strike?: string;
  spread?: number;
  vol?: number;
  notional: number;
  legAdj: boolean;
  buyer: string;
  seller: string;
  tradeDate: moment.Moment;
  dealId: string;
  status: DealStatus;
  style: string;
  model: string;
}
