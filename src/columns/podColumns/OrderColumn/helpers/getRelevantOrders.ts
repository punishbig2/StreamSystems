import { Order } from "types/order";
import { OrderTypes } from "types/mdEntry";
import { orderSorter } from "components/PodTile/helpers";

export const getRelevantOrders = (
  orders: ReadonlyArray<Order>,
  type: OrderTypes
): Order[] => {
  if (!orders) return [];
  const filtered = orders.filter((order: Order) => order.type === type);
  return filtered.sort(orderSorter(type));
};
