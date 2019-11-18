export enum ExecTypes {
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
  Account: string;
  AvgPx: string;
  ClOrdID: string;
  CumQty: string;
  Currency: string;
  ExecID: string;
  ExecTransType: string;
  LastShares: string;
  OrderID: string;
  OrderQty: string;
  OrdStatus: ExecTypes;
  OrdType: string;
  Price: string;
  Strategy: string;
  Tenor: string;
  Side: string;
  Symbol: string;
  TransactTime: Date;
  ExecType: ExecTypes;
  LeavesQty: string;
  Username: string;
}
