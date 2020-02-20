import {PodTable} from 'interfaces/podTable';
import {Order, OrderStatus} from 'interfaces/order';
import {PodRow} from 'interfaces/podRow';

export const getSelectedOrders = (orders: PodTable, defaultSize: number): Order[] => {
  const rows: PodRow[] = Object.values(orders)
    .filter((row: PodRow) => {
      const {bid, ofr} = row;
      if (bid.price === null && ofr.price === null)
        return false;
      if (bid.price === null || ofr.price === null)
        return true;
      return bid.price < ofr.price;
    });
  const ownOrDefaultQty = (order: Order, fallback: number | null): number => {
    const quantityEdited = (order.status & OrderStatus.QuantityEdited) !== 0;
    const canceled = (order.status & OrderStatus.Cancelled) !== 0;
    const preFilled = (order.status & OrderStatus.PreFilled) !== 0;
    if (quantityEdited || (preFilled && !canceled))
      return order.size as number;
    if (canceled && fallback !== defaultSize)
      return fallback as number;
    if (fallback === undefined || fallback === null)
      return defaultSize;
    return fallback as number;
  };
  const selection: Order[] = [
    ...rows.map(({bid}: PodRow) => ({
      ...bid,
      size: ownOrDefaultQty(bid, defaultSize),
    })),
    ...rows.map(({ofr}: PodRow) => ({
      ...ofr,
      size: ownOrDefaultQty(ofr, defaultSize),
    })),
  ];
  return selection.filter((order: Order) => {
    if (order.price === null || order.size === null)
      return false;
    return !((order.status & OrderStatus.QuantityEdited) === 0 && (order.status & OrderStatus.PriceEdited) === 0);
  });
};
