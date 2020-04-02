import { RunState } from 'redux/stateDefs/runState';
import { PodRow } from 'interfaces/podRow';
import { Order, OrderStatus } from 'interfaces/order';

export const updateSize = (state: RunState, data: { id: string; value: number | null }, key: 'ofr' | 'bid'): RunState => {
  const { orders } = state;
  const row: PodRow = orders[data.id];
  // Extract the target order
  const order: Order = row[key];
  if (order.isCancelled())
    return state;
  return {
    ...state,
    orders: {
      ...orders,
      [data.id]: {
        ...row,
        [key]: {
          ...order,
          size: data.value,
          // In this case also set `PriceEdited' bit because we want to make
          // the value eligible for submission
          status: order.status | OrderStatus.SizeEdited | OrderStatus.PriceEdited,
        },
      },
    },
  };
};
