import { OrderTypes } from 'interfaces/mdEntry';
import { Sides } from 'interfaces/sides';

export const getSideFromType = (type: OrderTypes): Sides => {
  switch (type) {
    case OrderTypes.Bid:
      return Sides.Buy;
    case OrderTypes.Ofr:
      return Sides.Sell;
    default:
      throw new Error('wrong type, it has no sensible side');
  }
};

export const percentage = (numerator: number, denominator: number, base: number): string => {
  const percentage: number = numerator / denominator;
  return `${percentage * base}ex`;
};

export const dispatchWorkspaceError = (message: string | null) => {
  document.dispatchEvent(new CustomEvent('workspace-error', { detail: message }));
};
