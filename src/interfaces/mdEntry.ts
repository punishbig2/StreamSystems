import {ArrowDirection} from 'interfaces/w';

export enum OrderTypes {
  Invalid = '',
  Ofr = '1',
  Bid = '0',
  DarkPool = '2'
}

export enum FirmTypes {
  Bank = 'BANK',
  Broker = 'BROKER'
}

export interface MDEntry {
  MDEntryType: OrderTypes;
  MDEntryPx: string;
  MDEntrySize: string;
  MDEntryOriginator: string;
  MDMkt?: string;
  OrderID?: string;
  TickDirection?: ArrowDirection;
  ExDestination?: string;
}
