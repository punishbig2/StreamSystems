import { Sides } from "interfaces/sides";
import moment from "moment";

export type Depo = [
  {
    currency: string;
    value: number;
  },
  {
    currency: string;
    value: number;
  }
];

interface BaseLeg {
  side: Sides;
  party: string;
  notional: number | null;
  premiumDate: moment.Moment | null;
  premium: number | null;
  price: number | null;
  strike: number | null;
  vol: number | null;
  expiryDate: moment.Moment;
  deliveryDate: moment.Moment;
  days: number | null;
  fwdPts: number | null;
  fwdRate: number | null;
  delta: number | null;
  gamma: number | null;
  vega: number | null;
  hedge: number | null;
  depo: Depo;
}

export interface Leg {
  option: string;
  side: Sides;
  party: string;
  notional: number | null;
  premiumDate: moment.Moment | null;
  premium: number | null;
  price: number | null;
  strike: number | null;
  vol: number | null;
  expiryDate: moment.Moment;
  deliveryDate: moment.Moment;
  days: number | null;
  fwdPts: number | null;
  fwdRate: number | null;
  delta: number | null;
  gamma: number | null;
  vega: number | null;
  hedge: number | null;
  depo: Depo;
}
