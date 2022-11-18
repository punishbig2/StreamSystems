import { RunState } from 'stateDefs/runState';
import { Order, OrderStatus } from 'types/order';
import { PodRow } from 'types/podRow';
import { PodTable } from 'types/podTable';

export const removeAll = (state: RunState, key: 'bid' | 'ofr'): RunState => {
  const orders: PodTable = { ...state.orders };
  const rows: Array<[string, PodRow]> = Object.entries(orders);
  const entries = rows.map(([index, row]: [string, PodRow]) => {
    const order: Order = row[key];
    if (order.price !== null)
      return [
        index,
        {
          ...row,
          [key]: {
            ...order,
            status: order.status | (OrderStatus.Cancelled & ~OrderStatus.Active),
          },
        },
      ];
    return [index, row];
  });
  return { ...state, orders: Object.fromEntries(entries) };
};
