import moment from "moment";

export interface Leg {
  type: string;
  notional: number;
  premium: number;
  price: number;
  strike: number;
  vol: number;
  expiryDate: moment.Moment;
  delta: number;
  gamma: number;
  vega: number;
  hedge: number;
  dealId: string;
  usi: number;
}
