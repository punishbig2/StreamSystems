import {EntryTypes} from 'interfaces/mdEntry';

export interface MessageBlotterEntry {
  Account: string;
  AvgPx: number;
  ClOrdID: string;
  CumQty: number;
  Currency: string;
  ExecID: string;
  ExecTransType: number;
  LastShares: number;
  OrderID: string;
  OrderQty: number;
  OrdStatus: number;
  OrdType: number;
  Price: number;
  Side: string;
  Symbol: string;
  TransactTime: Date;
  ExecType: number;
  LeavesQty: number;
}
