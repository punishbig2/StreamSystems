import moment from "moment";
import { Sides } from "interfaces/sides";

export interface Leg {
  option: string;
  side: Sides;
  party: string;
  notional: number;
  premiumDate: moment.Moment;
  premium: number;
  price: number;
  strike: number;
  vol: number;
  expiryDate: moment.Moment;
  deliveryDate: moment.Moment;
  days: number;
  fwdPts: number;
  fwdRate: number;
  delta: number;
  gamma: number;
  vega: number;
  hedge: number;
  ccy1Depo: number;
  ccy2Depo: number;
}
