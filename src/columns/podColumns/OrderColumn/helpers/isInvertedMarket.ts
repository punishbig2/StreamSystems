import { OrderStore } from 'mobx/stores/orderStore';
import { OrderTypes } from 'types/mdEntry';
import { Order, OrderStatus } from 'types/order';

export const isInvertedMarket = (
  store: OrderStore,
  depth: Order[],
  price: number | null
): boolean => {
  if (price === null) return false;

  const otherType: OrderTypes = store.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
  const allOrders: Order[] = depth.filter(
    (order: Order) => order.type === otherType && (order.status & OrderStatus.Cancelled) === 0
  );

  if (allOrders.length === 0) return false;

  return allOrders.some((order: Order) => {
    if (order.price === null || order.size === null) return false;
    if (order.type === OrderTypes.Bid) {
      return order.price > price;
    } else {
      return order.price < price;
    }
  });
};
