import { DealStatus } from "types/dealStatus";

export interface SEFUpdate {
  readonly dealId: string;
  readonly namespace: string;
  readonly usi: string;
  readonly status: DealStatus;
  readonly errorMsg: string | null;
}
