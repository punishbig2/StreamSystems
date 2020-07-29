import { Sides } from "types/sides";
import { action, observable } from "mobx";
import moment from "moment";
import { parser } from "utils/timeUtils";

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
  strike?: string | number | null;
  vol?: number | null;
  fwdPts: number | null;
  fwdRate: number | null;
  gamma: number | null;
  delta: number | null;
  vega: number | null;
  pricePercent: number | null;
  premiumCurrency: string;
  notional?: number | null;
  spot?: number;
  days?: number | null;
  party?: string;
  premiumDate: moment.Moment | null;
  premium: number | null;
  expiryDate: moment.Moment;
  deliveryDate: moment.Moment;
  hedge: number | null;
  rates: Rates;

  custom?: { [p: string]: any };
}
