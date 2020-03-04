import {PodTable} from 'interfaces/podTable';
import {Order, OrderStatus} from 'interfaces/order';
import {PodRow} from 'interfaces/podRow';
import {$$} from 'utils/stringPaster';

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
  const getSize = (order: Order, fallback: number | null): number | null => {
    const element: HTMLElement | null = document.getElementById($$('run-size-', order.uid(), order.type));
    if (element === null)
      return fallback;
    const input: HTMLInputElement = element as HTMLInputElement;
    const value: number = Number(input.value);
    if (isNaN(value))
      return fallback;
    return value;
  };
  const selection: Order[] = [
    ...rows.map(({bid}: PodRow) => ({
      ...bid,
      size: getSize(bid, defaultSize),
    })),
    ...rows.map(({ofr}: PodRow) => ({
      ...ofr,
      size: getSize(ofr, defaultSize),
    })),
  ];
  return selection.filter((order: Order) => {
    if (order.price === null || order.size === null)
      return false;
    return !((order.status & OrderStatus.SizeEdited) === 0 && (order.status & OrderStatus.PriceEdited) === 0);
  });
};
