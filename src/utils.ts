import {OrderTypes} from 'interfaces/mdEntry';
import {Sides} from 'interfaces/order';

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

export const percentage = (numerator: number, denominator: number): string => {
  const percentage: number = (100 * numerator) / denominator;
  return `${percentage}%`;
};

export const dispatchWorkspaceError = (message: string) => {
  document.dispatchEvent(new CustomEvent('workspace-error', {detail: message}));
};
