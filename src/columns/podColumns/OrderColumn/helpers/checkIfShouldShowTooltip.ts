import {PodRow} from 'interfaces/podRow';
import {Order, OrderStatus} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';
import {PodTable} from 'interfaces/podTable';

export const checkIfShouldShowTooltip = (depthOfTheBook: PodTable, type: OrderTypes): boolean => {
  return depthOfTheBook && Object.values(depthOfTheBook)
    .some((row: PodRow) => {
      const order: Order | null = (() => {
        switch (type) {
          case OrderTypes.Bid:
            return row.bid;
          case OrderTypes.Ofr:
            return row.ofr;
          default:
            return null;
        }
      })();
      if (!order)
        return false;
      return (order.status & OrderStatus.Cancelled) === 0;
    });
};
