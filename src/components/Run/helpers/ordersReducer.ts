import { Order } from "../../../types/order";
import { $$ } from "../../../utils/stringPaster";

export const ordersReducer = (
  map: { [id: string]: Order },
  order: Order
): { [id: string]: Order } => {
  const key: string = $$(order.symbol, order.strategy, order.tenor, order.type);
  // Add it to the map
  map[key] = order;
  // Return the updated map
  return map;
};
