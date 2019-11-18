import {MDEntry} from 'interfaces/mdEntry';

export enum MessageTypes {
  W = 'W', D = 'D', G = 'G', F = 'F',
}

export type TenorType = string;
export type StrategyType = string;
export type SymbolType = string;

export enum ArrowDirection {
  None = '0',
  Up = '1',
  Down = '2',
}

export interface W {
  MsgType: MessageTypes;
  TransactTime: number;
  User: string;
  Symbol: SymbolType;
  Strategy: StrategyType;
  Tenor: TenorType;
  NoMDEntries: number;
  Entries: MDEntry[];
  "9712": string;
  "9702": string;
}
