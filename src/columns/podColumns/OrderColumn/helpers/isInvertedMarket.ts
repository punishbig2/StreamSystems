import { OrderTypes } from 'interfaces/mdEntry';
import { Order } from 'interfaces/order';
import { SignalRManager } from 'redux/signalR/signalRManager';

export const isInvertedMarket = (order: Order, type: OrderTypes, price: number | null) => {
  const otherType: OrderTypes = order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
  const allOrders: Order[] = SignalRManager.getDepth(order.symbol, order.strategy, order.tenor, otherType);
  if (allOrders.length === 0)
    return false;
  return allOrders.every((order: Order) => {
    if (price === null)
      return true;
    if (order.price === null || order.isCancelled())
      return false;
    if (type === OrderTypes.Bid) {
      return order.price < price;
    } else {
      return order.price > price;
    }
  });
};
