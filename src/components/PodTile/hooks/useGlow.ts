import React from 'react';
import { Order, OrderStatus } from 'types/order';

export const useGlow = (
  litPool: { [tenor: string]: readonly Order[] },
  darkPool: { [tenor: string]: readonly Order[] }
): boolean => {
  return React.useMemo((): boolean => {
    const combiner = (combined: readonly Order[], next: readonly Order[]): readonly Order[] => [
      ...combined,
      ...next,
    ];

    const litPoolOrders: readonly Order[] = Object.values(litPool).reduce(combiner, []);

    const darkPoolOrders: readonly Order[] = Object.values(darkPool).reduce(combiner, []);

    return [...litPoolOrders, ...darkPoolOrders].some(
      (order: Order): boolean => (order.status & OrderStatus.Active) === OrderStatus.Active
    );
  }, [darkPool, litPool]);
};
