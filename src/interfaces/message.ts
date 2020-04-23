import { SymbolType, StrategyType, TenorType } from 'interfaces/w';

export enum ExecTypes {
  None = '',
  New = '0',
  PartiallyFilled = '1',
  Filled = '2',
  DoneForToday = '3',
  Canceled = '4',
  Replace = '5',
  PendingCancel = '6',
  Stopped = '7',
  Rejected = '8',
  Suspended = '9',
  PendingNew = 'A',
  Calculated = 'B',
  Expired = 'C',
  Restated = 'D',
  PendingReplace = 'E',
  Trade = 'F',
  TradeCorrect = 'G',
  TradeCancel = 'H',
  OrderStatus = 'I'
}

export interface Message {
  Account: string;
  AvgPx: string;
  ClOrdID: string;
  CumQty: string;
  Currency: string;
  ExecID: string;
  ExecTransType: string;
  LastShares: string;
  LastQty: string;
  OrderID: string;
  OrderQty: string;
  OrdType: string;
  Price: string;
  LastPx: string;
  Strategy: string;
  Tenor: string;
  Side: string;
  Symbol: string;
  TransactTime: string;
  OrdStatus: ExecTypes;
  ExecType: ExecTypes;
  LeavesQty: string;
  Username: string;
  MDMkt: string;
  ExecBroker: string;
  ContraTrader: string;
  ExDestination?: string;
  ClOrdLinkId?: string;
  ['583']?: string;
}

export interface DarkPoolMessage {
  User: string;
  Symbol: SymbolType;
  Strategy: StrategyType;
  Tenor: TenorType;
  DarkPrice: string;
}
