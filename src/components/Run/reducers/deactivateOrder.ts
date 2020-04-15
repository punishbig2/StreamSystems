import { RunState } from 'stateDefs/runState';
import { OrderTypes } from 'interfaces/mdEntry';
import { PodRow, PodRowStatus } from 'interfaces/podRow';

export const deactivateOrder = (state: RunState, { rowID, type }: { rowID: string, type: OrderTypes }): RunState => {
  const { original, orders } = state;
  const originalRow: PodRow = original[rowID];
  if (originalRow === undefined)
    return state;
  const key: 'ofr' | 'bid' = type === OrderTypes.Bid ? 'bid' : 'ofr';
  const { [key]: order } = originalRow;
  return {
    ...state,
    orders: {
      ...orders,
      [rowID]: {
        ...orders[rowID],
        status: PodRowStatus.Normal,
        mid: null,
        spread: null,
        [key]: order,
      },
    },
  };
};
