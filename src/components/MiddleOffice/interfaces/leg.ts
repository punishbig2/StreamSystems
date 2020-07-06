import { Sides } from "interfaces/sides";
import moment from "moment";

export type Rates = [
  {
    currency: string;
    value: number;
  },
  {
    currency: string;
    value: number;
  }
];

export interface Leg {
  option: string;
  side: string | Sides;
  premiumDate: moment.Moment | null;
  premium: number | null;
  strike: number | null;
  vol: number | null;
  expiryDate: moment.Moment;
  deliveryDate: moment.Moment;
  fwdPts: number | null;
  fwdRate: number | null;
  gamma: number | null;
  delta: number | null;
  vega: number | null;
  hedge: number | null;
  rates: Rates;
  pricePercent: number | null;
  premiumCurrency: string;
  notional?: number | null;
  spot?: number;
  days?: number | null;
  party?: string;
}
