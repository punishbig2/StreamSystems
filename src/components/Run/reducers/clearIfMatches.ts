import { Order, OrderStatus } from "interfaces/order";

export const clearIfMatches = (order: Order, id: string): Order => {
  if (order.orderId === id) {
    return {
      ...order,
      status: order.status | (OrderStatus.Cancelled & ~OrderStatus.Active),
    };
  } else {
    return order;
  }
};
