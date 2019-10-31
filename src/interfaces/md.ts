import {MDEntry} from 'interfaces/mdEntry';

export enum MessageTypes {
  W = 'W', D = 'D', G = 'G', F = 'F',
}

export interface Message {
  MsgType: MessageTypes;
  TransactTime: number;
  Symbol: string;
  Strategy: string;
  User: string;
  Tenor: string;
  NoMDEntries: number;
  Entries: MDEntry[];
}
