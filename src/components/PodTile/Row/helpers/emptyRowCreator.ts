import { OrderTypes } from 'types/mdEntry';
import { Order } from 'types/order';
import { PodRow, PodRowStatus } from 'types/podRow';

export const createRow = (symbol: string, strategy: string, tenor: string): PodRow => {
  const order: Order = new Order(tenor, '', '', '', null, OrderTypes.Invalid);
  return {
    tenor,
    id: tenor,
    bid: { ...order, type: OrderTypes.Bid },
    ofr: { ...order, type: OrderTypes.Ofr },
    mid: null,
    spread: null,
    darkPrice: null,
    status: PodRowStatus.Normal,
  };
};
