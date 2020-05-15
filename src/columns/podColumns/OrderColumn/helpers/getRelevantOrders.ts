import { Order } from "interfaces/order";
import { OrderTypes } from "interfaces/mdEntry";
import { orderSorter } from "components/PodTile/helpers";

export const getRelevantOrders = (
  orders: Order[],
  type: OrderTypes
): Order[] => {
  if (!orders) return [];
  return orders
    .filter((order: Order) => order.type === type && order.size !== null)
    .sort(orderSorter(type));
};
