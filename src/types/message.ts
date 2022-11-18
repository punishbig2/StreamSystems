import { StrategyType, SymbolType, TenorType } from 'types/w';

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
  OrderStatus = 'I',
}

export interface Message {
  readonly Account: string;
  readonly AvgPx: string;
  readonly ClOrdID: string;
  readonly CumQty: string;
  readonly Currency: string;
  readonly ExecID: string;
  readonly ExecTransType: string;
  readonly LastShares: string;
  readonly LastQty: string;
  readonly OrderID: string;
  readonly OrderQty: string;
  readonly OrdType: string;
  readonly Price: string;
  readonly LastPx: string;
  readonly Strategy: string;
  readonly Tenor: string;
  readonly Side: string;
  readonly Symbol: string;
  readonly TransactTime: string;
  readonly OrdStatus: ExecTypes;
  readonly ExecType: ExecTypes;
  readonly LeavesQty: string;
  readonly Username: string;
  readonly MDMkt: string;
  readonly ExecBroker: string;
  readonly ContraTrader: string;
  readonly ExDestination?: string;
  readonly ClOrdLinkId?: string;
  readonly CxlRejResponseTo: string | undefined;
  readonly FullName: string;
  readonly ContraFullName: string;
  readonly AggressorIndicator: 'Y' | 'N';
  readonly ['583']?: string;
}

export interface DarkPoolMessage {
  User: string;
  Symbol: SymbolType;
  Strategy: StrategyType;
  Tenor: TenorType;
  DarkPrice: string;
}
