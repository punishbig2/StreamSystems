import { DealStatus } from "types/dealStatus";
import { Symbol } from "types/symbol";

export interface Commission {
  rate: number | null;
  value: number | null;
}

export interface Deal {
  id: string;
  buyer: string;
  seller: string;
  currency: string;
  notional1: number;
  notional2?: number | null;
  strategy: string;
  currencyPair: string;
  symbol: Symbol;
  strike: number | string;
  vol: number | null;
  spread: number | null;
  price: number | null;

  tradeDate: Date;
  spotDate: Date;
  premiumDate: Date;

  tenor1: string;
  expiryDate1: Date;
  tenor2?: string;
  expiryDate2?: Date;

  source: string;
  status: DealStatus;

  premiumStyle: string;
  deltaStyle: string;
  // Summary stuff
  fwdRate1?: number;
  fwdPts1?: number;
  fwdRate2?: number;
  fwdPts2?: number;

  commissions?: {
    buyer: Commission;
    seller: Commission;
  };

  usi?: string;
}
