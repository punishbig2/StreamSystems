import { OrderTypes } from 'interfaces/mdEntry';
import { Order } from 'interfaces/order';

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
