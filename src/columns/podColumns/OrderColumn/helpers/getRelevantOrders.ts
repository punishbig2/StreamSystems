import { orderSorter } from 'components/PodTile/helpers';
import { OrderTypes } from 'types/mdEntry';
import { Order } from 'types/order';

export const getRelevantOrders = (orders: readonly Order[], type: OrderTypes): readonly Order[] => {
  if (!orders) return [];
  const filtered = orders.filter((order: Order) => order.type === type);
  filtered.sort(orderSorter(type));

  return filtered;
};
