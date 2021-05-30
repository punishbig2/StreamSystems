import workareaStore from "mobx/stores/workareaStore";
import React from "react";
import { MDEntry } from "types/mdEntry";
import { Order, OrderStatus } from "types/order";
import { W } from "types/w";

export const useGlow = (
  litPool: { [tenor: string]: ReadonlyArray<Order> },
  darkPool: { [tenor: string]: W }
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
    const darkPoolOrders: ReadonlyArray<Order> = Object.values(darkPool)
      .map(
        (w: W): ReadonlyArray<Order> => {
          return w.Entries.map(
            (entry: MDEntry): Order =>
              Order.fromWAndMDEntry(w, entry, workareaStore.user)
          );
        }
      )
      .reduce(combiner, []);
    return [...litPoolOrders, ...darkPoolOrders].some(
      (order: Order): boolean =>
        (order.status & OrderStatus.Active) === OrderStatus.Active
    );
  }, [darkPool, litPool]);
};
