import { Sides } from 'types/sides';
import { StyledValue } from 'types/styledValue';

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
  fwdPts: string | number | null;
  fwdRate: number | null;
  delta: StyledValue;
  price: StyledValue;
  premium: StyledValue;
  hedge: StyledValue;
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
  spotDate?: Date | null;

  custom?: { [p: string]: any };
}
