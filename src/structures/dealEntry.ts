import { Commission } from "components/MiddleOffice/types/deal";
import {
  InvalidStrategy,
  MOStrategy,
} from "components/MiddleOffice/types/moStrategy";
import { DealStatus } from "types/dealStatus";
import { InvalidSymbol, Symbol } from "types/symbol";
import { Tenor } from "types/tenor";

export enum DealType {
  Invalid = 0,
  Electronic = 1 << 1,
  Voice = 1 << 2,
  Manual = 1 << 3,
}

export enum EntryType {
  Empty,
  ExistingDeal,
  New,
  Clone,
}

export interface DealEntry {
  readonly dealID?: string;

  readonly symbol: Symbol;
  readonly strategy: MOStrategy;

  readonly tenor1: Tenor;
  readonly tenor2: Tenor | null;

  readonly dealstrike?: string | number;
  readonly spread?: number | null;
  readonly vol?: number | null;
  readonly not1: number | null;
  readonly not2?: number | null;
  readonly legadj: boolean;
  readonly premstyle: string;
  readonly deltastyle: string;
  readonly buyer: string;
  readonly seller: string;
  readonly style: string;
  readonly model: number | "";

  readonly legs: number | null;

  readonly status: DealStatus;

  readonly spotDate: Date;
  readonly premiumDate: Date;
  readonly tradeDate: Date;

  readonly type: EntryType;
  readonly dealType: DealType;

  readonly fwdrate1?: number;
  readonly fwdpts1?: number;
  readonly fwdrate2?: number;
  readonly fwdpts2?: number;
  readonly size: number;

  readonly usi?: string;

  readonly commissions:
    | {
        buyer: Commission;
        seller: Commission;
      }
    | undefined;
}

export const emptyDealEntry: DealEntry = {
  symbol: InvalidSymbol,
  strategy: InvalidStrategy,
  premstyle: "Forward",
  deltastyle: "Forward",
  legs: null,
  not1: null,
  not2: null,
  legadj: false,
  buyer: "",
  seller: "",
  tenor1: {
    expiryDate: new Date(),
    deliveryDate: new Date(),
    spotDate: new Date(),
    name: "",
  },
  tenor2: null,
  spotDate: new Date(),
  premiumDate: new Date(),
  tradeDate: new Date(),
  dealID: "",
  status: DealStatus.Pending,
  style: "European",
  model: 3,
  type: EntryType.Empty,
  dealType: DealType.Manual,
  vol: null,
  spread: null,

  size: 0,
  commissions: {
    buyer: {
      rate: 0,
      value: 0,
    },
    seller: {
      rate: 0,
      value: 0,
    },
  },
};

export interface ServerDealQuery {
  readonly linkid?: string;
  readonly tenor: string;
  readonly tenor1: string | null;
  readonly strategy: string;
  readonly symbol: string;
  readonly spread?: number | null;
  readonly vol?: number | null;
  readonly lastqty: number;
  readonly notional1: number | null;
  readonly size: number; // Notional / 1e6
  readonly lvsqty: "0";
  readonly cumqty: "0";
  readonly transacttime: string;
  readonly buyerentitycode: string;
  readonly sellerentitycode: string;
  readonly buyer: string;
  readonly seller: string;
  readonly useremail: string;
  readonly strike?: string | number;
  readonly expirydate: string;
  readonly expirydate1: string | null;
  readonly fwdrate1?: number;
  readonly fwdpts1?: number;
  readonly fwdrate2?: number;
  readonly fwdpts2?: number;
  readonly deltastyle: string;
  readonly premstyle: string;
  readonly product_fields_changed?: string[];
}
