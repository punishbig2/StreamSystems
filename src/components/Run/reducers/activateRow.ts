import { RunState } from 'stateDefs/runState';
import { PodRow } from 'interfaces/podRow';
import { fillSpreadAndMid } from 'components/Run/reducers/fillSpreadAndMid';
import { activateOrderIfPossible } from 'components/Run/reducers/activateOrderIfPossible';

export const activateRow = (state: RunState, rowID: string): RunState => {
  const { orders } = state;
  const row: PodRow = orders[rowID];
  if (row === undefined)
    return state;
  const { bid, ofr } = row;
  return {
    ...state,
    orders: {
      ...orders,
      [rowID]: fillSpreadAndMid({
        ...row,
        bid: { ...bid, status: activateOrderIfPossible(bid.status) },
        ofr: { ...ofr, status: activateOrderIfPossible(ofr.status) },
      }),
    },
  };
};
