import { OrderTypes } from 'interfaces/mdEntry';
import { Order } from 'interfaces/order';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { OrderStore } from 'mobx/stores/orderStore';

export const isInvertedMarket = (order: OrderStore, price: number | null) => {
  if (price === null)
    return false;
  const otherType: OrderTypes = order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
  const allOrders: Order[] = SignalRManager.getDepth(order.symbol, order.strategy, order.tenor, otherType);
  if (allOrders.length === 0)
    return false;
  return allOrders.some((order: Order) => {
    if (order.price === null || order.size === null)
      return false;
    if (order.type === OrderTypes.Bid) {
      return order.price > price;
    } else {
      return order.price < price;
    }
  });
};
