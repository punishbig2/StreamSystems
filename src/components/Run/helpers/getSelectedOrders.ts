import { Order, OrderStatus } from 'types/order';
import { PodRow } from 'types/podRow';
import { PodTable } from 'types/podTable';

export const getSelectedOrders = (orders: PodTable): Order[] => {
  const rows: PodRow[] = Object.values(orders).filter((row: PodRow) => {
    const { bid, ofr } = row;
    if (bid.price === null && ofr.price === null) return false;
    if (bid.price === null || ofr.price === null) return true;
    if ((bid.status & OrderStatus.Cancelled) !== 0 || (ofr.status & OrderStatus.Cancelled) !== 0)
      return true;
    return bid.price <= ofr.price;
  });
  const selection: Order[] = [
    ...rows.map(({ bid }: PodRow) => bid),
    ...rows.map(({ ofr }: PodRow) => ofr),
  ];
  return selection.filter((order: Order): boolean => {
    if (order.price === null || order.size === null) return false;
    return !(
      (order.status & OrderStatus.SizeEdited) === 0 &&
      (order.status & OrderStatus.PriceEdited) === 0
    );
  });
};
