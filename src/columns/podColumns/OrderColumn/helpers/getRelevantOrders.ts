import { Order } from "types/order";
import { OrderTypes } from "types/mdEntry";
import { orderSorter } from "components/PodTile/helpers";

export const getRelevantOrders = (
  orders: Order[],
  type: OrderTypes
): Order[] => {
  if (!orders) return [];
  return orders
    .filter((order: Order) => order.type === type)
    .sort(orderSorter(type));
};
