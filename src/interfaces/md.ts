import {MDEntry} from 'interfaces/mdEntry';

export enum MessageTypes {
  W = 'W', D = 'D', G = 'G', F = 'F',
}

export type TenorType = string;
export type StrategyType = string;
export type SymbolType = string;

export interface Message {
  MsgType: MessageTypes;
  TransactTime: number;
  User: string;
  Symbol: SymbolType;
  Strategy: StrategyType;
  Tenor: TenorType;
  NoMDEntries: number;
  Entries: MDEntry[];
}
