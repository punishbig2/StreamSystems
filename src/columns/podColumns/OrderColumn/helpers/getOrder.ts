import { OrderTypes } from 'types/mdEntry';
import { Order } from 'types/order';

export const getOrder = (type: OrderTypes, ofr: Order, bid: Order): Order => {
  switch (type) {
    case OrderTypes.Ofr:
      return ofr;
    case OrderTypes.Bid:
      return bid;
    default:
      return {} as Order;
  }
};
