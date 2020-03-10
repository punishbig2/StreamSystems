import {PodRow} from 'interfaces/podRow';
import {Order, OrderStatus} from 'interfaces/order';

const isOrderAcceptableForComputation = (order: Order): boolean => {
  const status: OrderStatus = order.status;
  if (order.price === null)
    return false;
  const isCancelled: boolean = (status & OrderStatus.Cancelled) !== 0;
  const isModified: boolean = ((status & OrderStatus.PriceEdited) !== 0) || ((status & OrderStatus.SizeEdited) !== 0);
  // If the order is not in the canceled state or was modified then it qualifies for
  // mid/spread computations
  return !isCancelled || isModified;
};

export const fillSpreadAndMid = (row: PodRow): PodRow => {
  const {ofr, bid} = row;
  if (isOrderAcceptableForComputation(ofr) && isOrderAcceptableForComputation(bid)) {
    return {
      ...row,
      spread: Number(ofr.price) - Number(bid.price),
      mid: (Number(ofr.price) + Number(bid.price)) / 2,
    };
  }
  return row;
};
