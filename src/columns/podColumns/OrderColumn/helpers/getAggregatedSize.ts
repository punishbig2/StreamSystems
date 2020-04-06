import { Order } from 'interfaces/order';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { priceFormatter } from 'utils/priceFormatter';
import { OrderStore } from 'mobx/stores/orderStore';

export const getAggregatedSize = (topOrder: OrderStore | Order): number | null => {
  const orders: Order[] = SignalRManager.getDepth(topOrder.symbol, topOrder.strategy, topOrder.tenor, topOrder.type);
  if (orders.length === 0) {
    if (topOrder instanceof OrderStore) {
      return topOrder.baseSize;
    } else {
      return topOrder.size;
    }
  } else if (orders.length === 1) {
    return orders[0].size;
  }
  return orders
    .filter((other: Order) => priceFormatter(other.price) === priceFormatter(topOrder.price))
    .reduce((size: number, order: Order) => size + ((order.size === null) ? 0 : order.size), 0);
};
