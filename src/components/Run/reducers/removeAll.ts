import { RunState } from "stateDefs/runState";
import { PodTable } from "interfaces/podTable";
import { PodRow } from "interfaces/podRow";
import { Order, OrderStatus } from "interfaces/order";

export const removeAll = (state: RunState, key: "bid" | "ofr"): RunState => {
  const orders: PodTable = { ...state.orders };
  const rows: [string, PodRow][] = Object.entries(orders);
  const entries = rows.map(([index, row]: [string, PodRow]) => {
    const order: Order = row[key];
    if (order.price !== null)
      return [
        index,
        {
          ...row,
          [key]: {
            ...order,
            status:
              order.status | (OrderStatus.Cancelled & ~OrderStatus.Active),
          },
        },
      ];
    return [index, row];
  });
  return { ...state, orders: Object.fromEntries(entries) };
};
