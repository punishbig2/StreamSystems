import { DealStatus } from 'types/dealStatus';
import { FXSymbol } from 'types/FXSymbol';

export interface Commission {
  rate: number | null;
  value: number | null;
}

export interface BackendDeal {
  readonly [key: string]: any;
}

export interface Deal {
  readonly id: string;
  readonly buyer: string;
  readonly buyer_useremail: string;
  readonly seller: string;
  readonly seller_useremail: string;
  readonly currency: string;
  readonly notional1: number;
  readonly notional2?: number | null;
  readonly strategy: string;
  readonly currencyPair: string;
  readonly symbol: FXSymbol;
  readonly strike: number | string | null;
  readonly vol: number | null;
  readonly spread: number | null;
  readonly price: number | null;
  readonly isdarkpool: boolean;
  readonly legAdj: boolean;

  readonly tradeDate: Date;
  readonly premiumDate: Date | null;

  readonly tenor1: string;
  readonly expiryDate1: Date;
  readonly tenor2?: string;
  readonly expiryDate2?: Date;

  readonly source: string;
  readonly status: DealStatus;
  readonly sef_namespace: string | null;
  readonly sef_dealid: string | null;
  readonly error_msg: string | null;

  readonly premiumStyle: string;
  readonly deltaStyle: string;
  // Summary stuff

  readonly commissions?: {
    buyer: Commission;
    seller: Commission;
  };

  readonly extraFields: { [key: string]: string | number | null } | undefined;

  readonly usi?: string;

  // Computed data
  readonly dealPrice: number | null;
}
