import { fillSpreadAndMid } from 'components/Run/reducers/fillSpreadAndMid';
import { isValidUpdate } from 'components/Run/reducers/isValidUpdate';
import equal from 'deep-equal';
import { RunState } from 'stateDefs/runState';
import { Order, OrderStatus } from 'types/order';
import { PodRow } from 'types/podRow';

export const updateOrder = (
  state: RunState,
  data: { id: string; order: Order },
  key: 'ofr' | 'bid'
): RunState => {
  const { orders } = state;
  const { order } = data;
  if (orders === undefined) return state;
  const row: PodRow = orders[data.id];
  if (row === undefined) return state;
  if ((row[key].status & OrderStatus.Active) !== 0 && (order.status & OrderStatus.Cancelled) !== 0)
    return state;
  if (!isValidUpdate(key === 'bid' ? order : row.bid, key === 'ofr' ? order : row.ofr))
    return state;
  const newRow: PodRow = fillSpreadAndMid({
    ...row,
    [key]: order,
  });
  if (equal(newRow, row)) return state;
  const newOrders = {
    ...orders,
    [data.id]: newRow,
  };
  return {
    ...state,
    // originalOrders: orders,
    orders: newOrders,
  };
};
