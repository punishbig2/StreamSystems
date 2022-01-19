import React from "react";
import { Order, OrderStatus } from "types/order";

export const useGlow = (
  litPool: { [tenor: string]: ReadonlyArray<Order> },
  darkPool: { [tenor: string]: ReadonlyArray<Order> }
): boolean => {
  return React.useMemo((): boolean => {
    const combiner = (
      combined: ReadonlyArray<Order>,
      next: ReadonlyArray<Order>
    ) => [...combined, ...next];

    const litPoolOrders: ReadonlyArray<Order> = Object.values(litPool).reduce(
      combiner,
      []
    );

    const darkPoolOrders: ReadonlyArray<Order> = Object.values(darkPool).reduce(
      combiner,
      []
    );

    return [...litPoolOrders, ...darkPoolOrders].some(
      (order: Order): boolean =>
        (order.status & OrderStatus.Active) === OrderStatus.Active
    );
  }, [darkPool, litPool]);
};
