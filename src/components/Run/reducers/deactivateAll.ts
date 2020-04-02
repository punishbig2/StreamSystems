import { RunState } from 'redux/stateDefs/runState';
import { PodRow } from 'interfaces/podRow';

export const deactivateAll = (state: RunState, rowID: string): RunState => {
  const { orders } = state;
  if (orders === undefined || rowID === undefined)
    return state;
  const row: PodRow = orders[rowID];
  if (row === undefined)
    return state;
  return {
    ...state,
    orders: {
      ...orders,
      [rowID]: state.original[rowID],
    },
  };
};
