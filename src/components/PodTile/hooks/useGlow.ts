import React from "react";
import { Order } from "types/order";

export const useGlow = (orders: { [tenor: string]: Order[] }): boolean => {
  return React.useMemo((): boolean => {
    return Object.keys(orders).length > 0;
  }, [orders]);
};
