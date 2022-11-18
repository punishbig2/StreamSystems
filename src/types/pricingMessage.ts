import { Leg } from 'components/MiddleOffice/types/leg';

export interface PricingMessage {
  readonly dealId: string;
  readonly legs: readonly Leg[];
  readonly useremail: string | null;
}
