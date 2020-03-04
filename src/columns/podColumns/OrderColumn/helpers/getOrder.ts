import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';

export const getOrder = (type: OrderTypes, ofr: Order, bid: Order) => {
  switch (type) {
    case OrderTypes.Invalid:
    case OrderTypes.DarkPool:
      throw new Error('cannot have a non order kind of price cell');
    case OrderTypes.Ofr:
      return ofr;
    case OrderTypes.Bid:
      return bid;
  }
};
