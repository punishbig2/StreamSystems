import { Tenor } from "./tenor";

export interface FixTenorResult {
  readonly tenor: Tenor | null;
  readonly horizonDateUTC: string;
  readonly spotDate: string;
  readonly tradeDate: string;
}
