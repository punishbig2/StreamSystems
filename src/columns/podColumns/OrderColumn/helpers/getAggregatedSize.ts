import { Order } from 'interfaces/order';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { priceFormatter } from 'utils/priceFormatter';

export const getAggregatedSize = (order: Order): number | null => {
  const orders: Order[] = SignalRManager.getDepth(order.symbol, order.strategy, order.tenor, order.type);
  if (orders.length === 0)
    return null;
  else if (orders.length === 1)
    return orders[0].size;
  return orders
    .filter((other: Order) => priceFormatter(other.price) === priceFormatter(order.price))
    .reduce((size: number, order: Order) => size + ((order.size === null) ? 0 : order.size), 0);
};
