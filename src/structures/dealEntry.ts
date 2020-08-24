import moment from "moment";
import { DealStatus } from "types/dealStatus";

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
  dealId: string;

  ccypair: string;
  tenor1: string;
  tenor1expiry: moment.Moment | null;
  tenor2: string;
  tenor2expiry: moment.Moment | null;
  dealstrike?: string | number;
  spread?: number | null;
  vol?: number | null;
  not1: number | null;
  not2?: number | null;
  legadj: boolean;
  premstyle?: string;
  deltastyle?: string;
  buyer: string;
  seller: string;
  style: string;
  model: number | "";

  strategy: string;
  legs: number | null;

  status: DealStatus;

  deliveryDate: moment.Moment;
  tradeDate: moment.Moment;
  type: EntryType;
  dealType: DealType;
}

export const emptyDealEntry: DealEntry = {
  ccypair: "",
  strategy: "",
  premstyle: "Forward",
  deltastyle: "Forward",
  legs: null,
  not1: null,
  not2: null,
  legadj: false,
  buyer: "",
  seller: "",
  tenor1expiry: null,
  tenor2expiry: null,
  deliveryDate: moment(),
  tradeDate: moment(),
  dealId: "",
  status: DealStatus.Pending,
  style: "European",
  model: 3,
  tenor1: "",
  tenor2: "",
  type: EntryType.Empty,
  dealType: DealType.Manual,
  vol: null,
  spread: null,
};
