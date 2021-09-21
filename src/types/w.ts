import { MDEntry } from "types/mdEntry";

export enum MessageTypes {
  W = "W",
  D = "D",
  G = "G",
  F = "F",
  M = "M",
}

export type TenorType = string;
export type StrategyType = string;
export type SymbolType = string;

export enum ArrowDirection {
  None = "",
  Up = "0",
  Down = "2",
}

export const DarkPool: string = "DP";

export interface W {
  MsgType: MessageTypes;
  TransactTime: number;
  User: string;
  Symbol: SymbolType;
  Strategy: StrategyType;
  Tenor: TenorType;
  NoMDEntries: number;
  Entries: MDEntry[];
  ExDestination: "DP" | undefined;
  "9712": "TOB" | undefined;
}

export const isPodW = (w: W | undefined) => {
  if (w === undefined) return false;
  return w["9712"] === "TOB";
};
