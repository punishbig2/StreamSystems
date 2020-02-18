import {TOBRowStatus} from 'interfaces/podRow';
import {Order} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';

export const createRow = (symbol: string, strategy: string, tenor: string) => {
  const order: Order = new Order(tenor, '', '', '', null, OrderTypes.Invalid);
  return {
    tenor,
    id: tenor,
    bid: {...order, type: OrderTypes.Bid},
    ofr: {...order, type: OrderTypes.Ofr},
    mid: null,
    spread: null,
    darkPrice: null,
    status: TOBRowStatus.Normal,
  };
};
