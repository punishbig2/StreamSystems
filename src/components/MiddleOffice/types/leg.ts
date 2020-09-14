import { Sides } from "types/sides";

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
  delta: [number | null, number | null, number | null];
  price: [number | null, number | null, number | null];
  premium: [number | null, number | null, number | null];
  hedge: [number | null, number | null, number | null];
  premiumCurrency: string;
  notional?: number | null;
  spot?: number;
  days?: number | null;
  party?: string;
  premiumDate: Date | null;
  expiryDate: Date | null;
  deliveryDate: Date | null;
  rates: Rates;
  usi_num: number | null;

  custom?: { [p: string]: any };
}
