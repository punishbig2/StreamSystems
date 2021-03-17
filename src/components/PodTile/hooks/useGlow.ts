import React from "react";
import { Order, OrderStatus } from "types/order";

export const useGlow = (orders: { [tenor: string]: Order[] }): boolean => {
  return React.useMemo((): boolean => {
    const all: ReadonlyArray<Order> = Object.values(orders).reduce(
      (combined: ReadonlyArray<Order>, next: ReadonlyArray<Order>) => [
        ...combined,
        ...next,
      ],
      []
    );
    return all.some(
      (order: Order): boolean =>
        (order.status & OrderStatus.Active) === OrderStatus.Active
    );
  }, [orders]);
};
