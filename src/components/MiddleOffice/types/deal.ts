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
  strike: number | string | null;
  vol: number | null;
  spread: number | null;
  price: number | null;
  isdarkpool: boolean;
  legAdj: boolean;

  tradeDate: Date;
  spotDate: Date;
  premiumDate: Date;

  tenor1: string;
  expiryDate1: Date;
  tenor2?: string;
  expiryDate2?: Date;

  source: string;
  status: DealStatus;
  sef_namespace: string | null;
  error_msg: string;

  premiumStyle: string;
  deltaStyle: string;
  // Summary stuff

  commissions?: {
    buyer: Commission;
    seller: Commission;
  };

  extraFields: { [key: string]: string | number | null } | undefined;

  usi?: string;
}
